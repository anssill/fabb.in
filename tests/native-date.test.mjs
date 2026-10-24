import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/load-source.mjs'

const { isAppleDevice, localDate, updateBookingDate } = loadSource('src/lib/native-date.ts')

test('native date selection covers iPhone, iPad desktop mode and Mac without changing other platforms', () => {
  for (const platform of ['iPhone', 'iPad', 'iPod', 'MacIntel', 'MacARM']) assert.equal(isAppleDevice(platform, ''), true)
  assert.equal(isAppleDevice('', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), true)
  assert.equal(isAppleDevice('Win32', 'Chrome'), false)
  assert.equal(isAppleDevice('Linux armv8l', 'Android'), false)
})

test('date changes preserve same-day bookings and clear only conflicting dates', () => {
  const dates = { event_date: '2027-03-10', pickup_date: '2027-03-10', return_date: '2027-03-12', fitting_date: '2027-03-09' }
  assert.deepEqual(updateBookingDate(dates, 'event_date', '2027-03-10'), dates)
  assert.deepEqual(updateBookingDate(dates, 'event_date', '2027-03-09'), { ...dates, event_date: '2027-03-09', pickup_date: '', return_date: '' })
  assert.equal(updateBookingDate(dates, 'pickup_date', '2027-03-08').fitting_date, '')
  assert.equal(updateBookingDate(dates, 'pickup_date', '2027-03-13').return_date, '')
  assert.equal(updateBookingDate(dates, 'fitting_date', '').fitting_date, '')
  const local = localDate('2027-03-10')
  assert.deepEqual([local.getFullYear(), local.getMonth(), local.getDate()], [2027, 2, 10])
})

test('Apple fields retain date constraints, allow clearing and reject invalid selections', () => {
  const calls = []
  const { AppleDatePicker } = loadSource('src/components/shared/AppleDatePicker.tsx', {
    react: { useSyncExternalStore: () => true },
    '@/components/ui/input': { Input: 'input' },
  })
  const element = AppleDatePicker({ id: 'event', label: 'Event date', value: '2027-03-10', min: '2027-03-01', max: '2027-03-20', onChange: value => calls.push(value) })
  assert.equal(element.props.type, 'date')
  assert.equal(element.props.min, '2027-03-01')
  assert.equal(element.props.max, '2027-03-20')
  element.props.onChange({ currentTarget: { value: '2027-03-11', validity: { valid: true } } })
  element.props.onChange({ currentTarget: { value: '2027-02-01', validity: { valid: false } } })
  element.props.onChange({ currentTarget: { value: '', validity: { valid: false } } })
  assert.deepEqual(calls, ['2027-03-11', ''])
  const fallback = loadSource('src/components/shared/AppleDatePicker.tsx', {
    react: { useSyncExternalStore: () => false },
    '@/components/ui/input': { Input: 'input' },
  }).AppleDatePicker({ children: 'existing calendar' })
  assert.equal(fallback, 'existing calendar')
})
