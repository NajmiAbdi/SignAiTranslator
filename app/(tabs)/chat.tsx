import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Send, Mic, Volume2, Hand } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { aiService } from '../../services/aiService';

interface Message {
  id: string;
  text: string;
  type: 'text' | 'sign' | 'speech';
  timestamp: number;
  isUser: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      initializeUser();
      loadChatHistory();
      
      // Subscribe to real-time chat updates
      const chatSubscription = supabase
        .channel('chats')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chats' },
          handleRealtimeMessage
        )
        .subscribe();

      return () => {
        chatSubscription.unsubscribe();
      };
    }
  }, []);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages = chats?.map(chat => ({
        id: chat.chat_id,
        text: chat.message,
        type: chat.type as 'text' | 'sign' | 'speech',
        timestamp: new Date(chat.timestamp).getTime(),
        isUser: true,
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleRealtimeMessage = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new.user_id === user?.id) {
      const newMessage: Message = {
        id: payload.new.chat_id,
        text: payload.new.message,
        type: payload.new.type,
        timestamp: new Date(payload.new.timestamp).getTime(),
        isUser: true,
      };
      
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (text: string, type: 'text' | 'sign' | 'speech' = 'text') => {
    if (!text.trim()) return;

    setIsLoading(true);

    try {
      // Add user message to local state
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        text,
        type,
        timestamp: Date.now(),
        isUser: true,
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Save to database if Supabase is configured
      if (isSupabaseConfigured() && user) {
        try {
          await supabase.from('chats').insert({
            chat_id: userMessage.id,
            user_id: user.id,
            message: text,
            type,
            metadata: { source: 'chat' },
          });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }

      // Generate AI response based on type
      let aiResponse = '';
      if (type === 'text') {
        const signResult = await aiService.speechToSign('');
        aiResponse = `Converted to sign language animation (${signResult.animations.length} gestures)`;
      } else if (type === 'sign') {
        aiResponse = 'Sign language recognized and translated';
      }

      // Add AI response
      if (aiResponse) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          text: aiResponse,
          type: 'text',
          timestamp: Date.now(),
          isUser: false,
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        if (isSupabaseConfigured() && user) {
          try {
            await supabase.from('chats').insert({
              chat_id: aiMessage.id,
              user_id: user.id,
              message: aiResponse,
              type: 'text',
              metadata: { source: 'ai_response' },
            });
          } catch (error) {
            console.error('Error saving AI response:', error);
          }
        }
      }

      setInputText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToSign = async () => {
    if (!inputText.trim()) return;
    
    try {
      setIsLoading(true);
      const mockResult = {
        animations: ['hello', 'world', 'sign'],
        duration: 2000,
        keyframes: []
      };
      await sendMessage(`Speech converted to sign: ${mockResult.animations.join(', ')}`, 'speech');
    } catch (error) {
      console.error('Speech to sign error:', error);
      Alert.alert('Error', 'Failed to convert speech to sign');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={styles.messageType}>
          {message.type === 'sign' && <Hand size={16} color="#10B981" />}
          {message.type === 'speech' && <Volume2 size={16} color="#F59E0B" />}
          {message.type === 'text' && <Text style={styles.typeText}>Text</Text>}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.messageText}>{message.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sign Language Chat</Text>
        <Text style={styles.headerSubtitle}>Real-time translation</Text>
        {!isSupabaseConfigured() && (
          <Text style={styles.warningText}>⚠️ Demo mode - Supabase not configured</Text>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingMessage}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <View style={styles.inputActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSpeechToSign}
            disabled={isLoading || !inputText.trim()}
          >
            <Hand color="#10B981" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Send color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loadingMessage: {
    alignSelf: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});