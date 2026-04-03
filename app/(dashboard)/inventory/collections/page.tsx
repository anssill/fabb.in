'use client'

import { useState } from 'react'
import { useCollections, useCreateCollection, useItems } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Plus, FolderOpen, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CollectionsPage() {
  const { data: collections = [], isLoading } = useCollections()
  const { data: allItems = [] } = useItems()
  const { mutateAsync: createCollection } = useCreateCollection()

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    await createCollection({ name: name.trim() })
    setName('')
    setIsOpen(false)
  }

  const filtered = collections.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="border border-zinc-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-zinc-500 mt-1">Group items into curated sets for quick browsing.</p>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={<Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold gap-2" />}>
              <Plus className="w-4 h-4" /> New Collection
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md bg-white">
            <SheetHeader>
              <SheetTitle>Create Collection</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Collection Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bridal Sets"
                />
              </div>
              <Button className="w-full bg-zinc-900 text-white" onClick={handleCreate}>
                Create Collection
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-zinc-500 py-10 text-center">Loading collections...</p>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center text-zinc-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3" />
          <p className="font-medium">No collections yet</p>
          <p className="text-sm mt-1">Create your first collection to organise items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((collection: any) => (
            <div
              key={collection.id}
              className="p-6 rounded-xl border border-zinc-200 bg-white hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-zinc-500" />
                </div>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                  0 items
                </Badge>
              </div>
              <h3 className="text-lg font-semibold group-hover:text-zinc-700 transition-colors">
                {collection.name}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Drag items here or assign from item details.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
