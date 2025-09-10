import { Panda } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <Panda className="size-6" />
              </div>
              <span className="sr-only">Agora</span>
            </a>
            <h1 className="text-xl font-bold">Bienvenue sur Agora</h1>
            <div className="text-center text-sm">
              Pas encore de compte ?{" "}
              <a href="#" className="underline underline-offset-4">
                S&apos;inscrire
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </div>
          <div className="text-center text-sm">
            <a href="#" className="underline underline-offset-4">
              Mot de passe oublié ?
            </a>
          </div>
        </div>
      </form>
    </div>
  )
}