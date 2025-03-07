'use client'

import React, { useState, useRef, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Send, Cloud, CloudRain, Sun, Wind, ThermometerSun, Droplets } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your weather assistant. Please enter a location to get the current weather information.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    } finally {
      setLoading(false);
    }
  };

  const WeatherIcon = ({ weatherInfo }: { weatherInfo: string }) => {
    if (weatherInfo.toLowerCase().includes('rain') || weatherInfo.toLowerCase().includes('drizzle')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    } else if (weatherInfo.toLowerCase().includes('cloud')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    } else if (weatherInfo.toLowerCase().includes('clear') || weatherInfo.toLowerCase().includes('sun')) {
      return <Sun className="h-6 w-6 text-yellow-500" />;
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
            
            const icon = (() => {
              if (line.includes('Temperature:')) return <ThermometerSun className="h-4 w-4 text-red-500" />;
              if (line.includes('Feels like:')) return <ThermometerSun className="h-4 w-4 text-orange-500" />;
              if (line.includes('Condition:')) {
                const condition = line.split(': ')[1];
                return <WeatherIcon weatherInfo={condition} />;
              }
              if (line.includes('Humidity:')) return <Droplets className="h-4 w-4 text-blue-500" />;
              if (line.includes('Precipitation:')) return <CloudRain className="h-4 w-4 text-blue-400" />;
              if (line.includes('Wind speed:')) return <Wind className="h-4 w-4 text-blue-300" />;
              return null;
            })();
            
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
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-2xl mx-auto p-4">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            Weather Assistant
          </CardTitle>
          <CardDescription>Ask about the weather in any location</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
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
            />
            <Button type="submit" disabled={loading || !input.trim()}>
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