import { Metadata } from 'next'
import { FileUpload } from '@/components/ui/file-upload'
import { FileManager } from '@/components/ui/file-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Gestion des fichiers - Agora',
  description: 'Gérez vos fichiers et documents sur Agora'
}

export default function GestionFichiersPage() {
  const handleUploadComplete = (files: any[]) => {
    // Refresh the file manager
    window.location.reload()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des fichiers</h1>
        <p className="text-muted-foreground">
          Uploadez et gérez vos documents, images et autres fichiers
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload de fichiers</TabsTrigger>
          <TabsTrigger value="manage">Mes fichiers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="grid gap-6">
            <FileUpload
              category="document"
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload
                category="user"
                onUploadComplete={handleUploadComplete}
                maxFiles={5}
                accept="image/*"
                className="h-fit"
              />
              <FileUpload
                category="salle"
                onUploadComplete={handleUploadComplete}
                maxFiles={8}
                accept="image/*,.pdf"
                className="h-fit"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <FileManager 
            category="all"
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}