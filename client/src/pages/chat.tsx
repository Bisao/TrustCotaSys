import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'system';
  timestamp: Date;
  avatar?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bem-vindo ao chat interno do sistema! Como posso ajudá-lo hoje?',
      sender: 'system',
      timestamp: new Date(),
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate system response
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Obrigado por sua mensagem. Esta é uma funcionalidade em desenvolvimento.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Chat Interno" subtitle="Comunicação da equipe" />
        
        <main className="flex-1 overflow-hidden p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="material-icons">chat</span>
                  <span>Conversas da Equipe</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                        }`}>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {message.sender === 'user' ? 'U' : 'S'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className={`p-3 rounded-lg ${
                            message.sender === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} data-testid="button-send-message">
                      <span className="material-icons">send</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Pressione Enter para enviar</span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Online</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}