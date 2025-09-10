"use client"

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)

interface PaymentFormProps {
  clientSecret: string
  amount: number
  reservationId: string
  onSuccess?: () => void
}

function CheckoutForm({ amount, reservationId, onSuccess }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reservations?payment=success`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || 'Une erreur est survenue')
      } else {
        setMessage('Une erreur inattendue est survenue.')
      }
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total à payer:</span>
          <span className="text-lg font-bold">{amount}€</span>
        </div>
      </div>
      
      {message && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {message}
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Payer {amount}€
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentForm({ clientSecret, amount, reservationId, onSuccess }: PaymentFormProps) {
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#e11d48',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Finaliser le paiement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm 
            amount={amount} 
            reservationId={reservationId} 
            onSuccess={onSuccess} 
          />
        </Elements>
      </CardContent>
    </Card>
  )
}