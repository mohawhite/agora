import { GalleryVerticalEnd, User, Building, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RegisterRolePage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Agora
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className="flex flex-col gap-6">
              <div className="absolute top-6 left-6">
                <Link href="/auth/register">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors" type="button">
                    <ArrowLeft className="size-5" />
                  </button>
                </Link>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Choisissez votre type de compte</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Sélectionnez le type de compte qui vous correspond
                </p>
              </div>
              
              <div className="grid gap-6">
                <Link href="/auth/register/user">
                  <Button variant="outline" className="w-full h-12">
                    <User className="size-4 mr-2" />
                    Utilisateur
                  </Button>
                </Link>
                
                <Link href="/auth/register/mairie">
                  <Button variant="outline" className="w-full h-12">
                    <Building className="size-4 mr-2" />
                    Mairie
                  </Button>
                </Link>
              </div>
              
              <div className="text-center text-sm">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}