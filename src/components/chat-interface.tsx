'use client'
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, getWeatherByLocation, WeatherInfo } from '@/actions/weather';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Send, Cloud, CloudRain, Sun, Wind, ThermometerSun, Droplets, CloudLightning, CloudSnow, CloudFog, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Add these styles to your globals.css file
const scrollStyles = `
/* Custom scrollbar styles for chat interface */
.chat-scrollbar {
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: rgba(155, 155, 155, 0.5) transparent; /* For Firefox */
}

.chat-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.chat-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
  margin: 4px 0;
}

.chat-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(155, 155, 155, 0.5);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.chat-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(155, 155, 155, 0.7);
}

/* Dark mode scrollbar adjustments */
.dark .chat-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.3);
}

.dark .chat-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 200, 200, 0.5);
}

/* For the message animations */
@keyframes message-appear {
  from { 
    opacity: 0; 
    transform: translateY(10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

.message-animation {
  animation: message-appear 0.3s ease-out forwards;
}
`;

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weatherChatHistory');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved chat history');
        }
      }
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your weather assistant. Please enter a location to get the current weather information.",
      },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastWeatherInfo, setLastWeatherInfo] = useState<WeatherInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Add styles to the document head only on client side
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.textContent = scrollStyles;
      document.head.appendChild(styleEl);
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (typeof window !== 'undefined') {
      localStorage.setItem('weatherChatHistory', JSON.stringify(messages));
    }
  }, [messages]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm your weather assistant. Please enter a location to get the current weather information.",
      },
    ]);
    setLastWeatherInfo(null);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await getWeatherByLocation(input.trim());
      
      let responseContent = '';
      if (result.success && result.weatherInfo) {
        const info = result.weatherInfo;
        setLastWeatherInfo(info);
        responseContent = `Weather in ${info.location}:\n
Temperature: ${info.temperature}${info.unit}\n
Feels like: ${info.feelsLike}${info.unit}\n
Condition: ${info.description}\n
Humidity: ${info.humidity}%\n
Precipitation: ${info.precipitation} mm\n
Wind speed: ${info.windSpeed} km/h`;
      } else {
        responseContent = result.message || 'Sorry, I could not find weather data for that location.';
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat submit:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast(
        "Failed to fetch weather data. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (description: string) => {
    if (!description) return <Cloud className="h-6 w-6 text-gray-400" />;
    
    const desc = description.toLowerCase();
    
    if (desc.includes('thunderstorm')) {
      return <CloudLightning className="h-6 w-6 text-amber-500" />;
    } else if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    } else if (desc.includes('snow')) {
      return <CloudSnow className="h-6 w-6 text-blue-200" />;
    } else if (desc.includes('fog') || desc.includes('mist')) {
      return <CloudFog className="h-6 w-6 text-gray-400" />;
    } else if (desc.includes('cloud')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    } else if (desc.includes('clear') || desc.includes('sun')) {
      return <Sun className="h-6 w-6 text-yellow-500 pulse-gentle" />;
    } else {
      return <Cloud className="h-6 w-6 text-gray-400" />;
    }
  };
  
  const formatMessage = (content: string) => {
    if (content.includes('Temperature:')) {
      const lines = content.split('\n');
      return (
        <div className="space-y-2">
          <div className="font-semibold">{lines[0]}</div>
          {lines.slice(1).map((line, index) => {
            if (line.trim() === '') return null;
            let icon;
            if (line.includes('Temperature:')) {
              icon = <ThermometerSun className="h-4 w-4 text-red-500" />;
            } else if (line.includes('Feels like:')) {
              icon = <ThermometerSun className="h-4 w-4 text-orange-500" />;
            } else if (line.includes('Condition:')) {
              const condition = line.split(': ')[1] || '';
              icon = getWeatherIcon(condition);
            } else if (line.includes('Humidity:')) {
              icon = <Droplets className="h-4 w-4 text-blue-500" />;
            } else if (line.includes('Precipitation:')) {
              icon = <CloudRain className="h-4 w-4 text-blue-400" />;
            } else if (line.includes('Wind speed:')) {
              icon = <Wind className="h-4 w-4 text-blue-300" />;
            }
            return (
              <div key={index} className="flex items-center gap-2">
                {icon}
                <span>{line.trim()}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return content;
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-2rem)] max-w-2xl mx-auto p-4 transition-colors duration-500`}>
      <Card className="flex flex-col h-full bg-opacity-90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-blue-500" />
              Weather Assistant
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat} 
              aria-label="Clear chat history"
              className="h-8 px-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Ask about the weather in any location</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto mb-4 space-y-4 chat-scrollbar">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex message-animation ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  message.content
                ) : (
                  formatMessage(message.content)
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              placeholder="Enter a location (e.g., New York, Paris, Tokyo)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
              ref={inputRef}
              aria-label="Location input"
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              aria-label="Search weather"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}