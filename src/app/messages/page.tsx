"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, User, Building2 } from "lucide-react"

interface Message {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
    mairie?: {
      name: string
    }
  }
  reservation?: {
    id: string
    salle: {
      name: string
    }
  }
}

interface Conversation {
  id: string
  lastMessage: Message
  messages: Message[]
  unreadCount: number
  participant: {
    id: string
    firstName: string
    lastName: string
    role: string
    mairie?: {
      name: string
    }
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (conversationId: string) => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage("")
        loadConversations()
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}j`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos messages...</p>
        </div>
      </div>
    )
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="min-h-screen bg-background pb-20 flex">
      {/* Liste des conversations */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </div>

        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune conversation</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {conversation.participant.role === 'MAIRIE' ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">
                        {conversation.participant.role === 'MAIRIE' 
                          ? conversation.participant.mairie?.name 
                          : `${conversation.participant.firstName} ${conversation.participant.lastName}`
                        }
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.lastMessage.createdAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.content}
                    </p>
                    
                    {conversation.lastMessage.reservation && (
                      <p className="text-xs text-primary mt-1">
                        À propos de: {conversation.lastMessage.reservation.salle.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  {selectedConv.participant.role === 'MAIRIE' ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedConv.participant.role === 'MAIRIE' 
                      ? selectedConv.participant.mairie?.name 
                      : `${selectedConv.participant.firstName} ${selectedConv.participant.lastName}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConv.participant.role === 'MAIRIE' ? 'Mairie' : 'Utilisateur'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConv.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.id === selectedConv.participant.id ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender.id === selectedConv.participant.id
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage(selectedConv.id)
                    }
                  }}
                />
                <Button
                  onClick={() => sendMessage(selectedConv.id)}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}