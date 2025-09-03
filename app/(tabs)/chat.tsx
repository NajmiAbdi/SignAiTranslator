import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Send, Mic, MicOff, Volume2, User, Bot } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { geminiService } from '../../services/geminiService';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  type: 'text' | 'speech' | 'sign';
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChatHistory();
    setupAudio();
    
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => {});
    }
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!isSupabaseConfigured()) {
      // Add demo messages for non-configured state
      setMessages([
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant for sign language translation. How can I help you today?',
          isUser: false,
          timestamp: new Date().toISOString(),
          type: 'text'
        }
      ]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (chats && chats.length > 0) {
        const formattedMessages = chats.map(chat => ({
          id: chat.chat_id,
          text: chat.message,
          isUser: chat.type !== 'ai_response',
          timestamp: chat.timestamp,
          type: chat.type as 'text' | 'speech' | 'sign'
        }));
        setMessages(formattedMessages);
      } else {
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            text: 'Hello! I\'m your AI assistant for sign language translation. How can I help you today?',
            isUser: false,
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (text: string, type: 'text' | 'speech' = 'text') => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      type
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get AI response from Gemini
      const aiResponse = await geminiService.chatResponse(text);
      
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        text: aiResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      setMessages(prev => [...prev, botMessage]);

      // Save to Supabase if configured
      if (isSupabaseConfigured() && user) {
        try {
          await supabase.from('chats').insert([
            {
              chat_id: userMessage.id,
              user_id: user.id,
              message: userMessage.text,
              type: userMessage.type,
              metadata: { source: 'user_input' }
            },
            {
              chat_id: botMessage.id,
              user_id: user.id,
              message: botMessage.text,
              type: 'ai_response',
              metadata: { source: 'gemini_api', model: 'gemini-1.5-pro' }
            }
          ]);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to use voice input');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    try {
      setIsLoading(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Simulate speech recognition result
        const mockTranscription = "Hello, how can I help you with sign language?";
        
        // Use Gemini API to clean up and improve the transcription
        const transcriptionResult = await geminiService.transcribeSpeech(mockTranscription);
        const cleanedText = transcriptionResult.text;
        
        await sendMessage(cleanedText, 'speech');
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playMessage = (text: string) => {
    try {
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.85,
        quality: 'enhanced'
      });
    } catch (error) {
      console.error('TTS error:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageBubble,
      message.isUser ? styles.userBubble : styles.botBubble
    ]}>
      <View style={styles.messageHeader}>
        <View style={styles.messageIcon}>
          {message.isUser ? (
            <User color={message.isUser ? "#FFFFFF" : "#3B82F6"} size={16} />
          ) : (
            <Bot color="#3B82F6" size={16} />
          )}
        </View>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.botText
        ]}>
          {message.text}
        </Text>
        {!message.isUser && (
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => playMessage(message.text)}
          >
            <Volume2 color="#6B7280" size={16} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[
        styles.timestamp,
        message.isUser ? styles.userTimestamp : styles.botTimestamp
      ]}>
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Chat Assistant</Text>
        <Text style={styles.headerSubtitle}>Ask questions about sign language</Text>
        {!isSupabaseConfigured() && (
          <Text style={styles.warningText}>⚠️ Demo mode - Supabase not configured</Text>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <View style={styles.messageHeader}>
              <View style={styles.messageIcon}>
                <Bot color="#3B82F6" size={16} />
              </View>
              <Text style={[styles.messageText, styles.botText]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        
        <View style={styles.inputButtons}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            {isRecording ? (
              <MicOff color="#FFFFFF" size={20} />
            ) : (
              <Mic color="#6B7280" size={20} />
            )}
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1F2937',
  },
  playButton: {
    padding: 4,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimestamp: {
    color: '#9CA3AF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginBottom: 12,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});