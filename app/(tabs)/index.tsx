// app/(tabs)/camera/CameraScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { RotateCcw, Play, Square, Volume2 } from 'lucide-react-native';
import { aiService } from '../../services/aiService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// Expo docs: sug onCameraReady kahor takePictureAsync + isticmaal useCameraPermissions.  :contentReference[oaicite:1]{index=1}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [user, setUser] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.warn('Audio init failed:', e);
      }
    })();

    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => {});
    }
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => setFacing(prev => (prev === 'back' ? 'front' : 'back'));

  const startCapture = async () => {
    if (!cameraRef.current) return;
    if (!isCameraReady) {
      Alert.alert('Please wait', 'Camera is not ready yet');
      return;
    }

    setIsCapturing(true);
    setTranslatedText('');

    try {
      // delay yar si hardware-ku u degto marka screen-ka la furo
      await new Promise(res => setTimeout(res, 120));

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: false,
      });

      if (!photo?.base64) throw new Error('No image data');

      const result = await aiService.recognizeSign(photo.base64);
      setTranslatedText(result.text ?? '');

      if (isSupabaseConfigured() && user) {
        await supabase.from('chats').insert({
          chat_id: `${user.id}_${Date.now()}`,
          user_id: user.id,
          message: result.text ?? '',
          type: 'sign',
          metadata: { confidence: result.confidence, gestures: result.gestures },
        });
      }
    } catch (e: any) {
      console.error('Recording error:', e);
      Alert.alert('Error', e?.message || 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCapture = () => setIsCapturing(false);

  const playAudio = () => {
    if (!translatedText) return;
    try {
      Speech.speak(translatedText, { language: 'en', pitch: 1.0, rate: 0.9 });
    } catch (e) {
      console.error('TTS error:', e);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
        active={true}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Overlays banaanka CameraView — maadaama CameraView children si fiican u taageerin. :contentReference[oaicite:2]{index=2} */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <RotateCcw color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        {!!translatedText && (
          <View style={styles.translationContainer}>
            <Text style={styles.translatedText}>{translatedText}</Text>
            <TouchableOpacity style={styles.playButton} onPress={playAudio}>
              <Volume2 color="#3B82F6" size={20} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recordingControls}>
          <TouchableOpacity
            style={[styles.recordButton, isCapturing && styles.recordButtonActive]}
            onPress={isCapturing ? stopCapture : startCapture}
            disabled={!isCameraReady || isCapturing}
          >
            {isCapturing ? <Square color="#FFFFFF" size={32} /> : <Play color="#FFFFFF" size={32} />}
          </TouchableOpacity>
          {!isCameraReady && <Text style={{ color: '#fff', marginTop: 8 }}>Initializing camera…</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 10, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 8, margin: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  controlsContainer: { position: 'absolute', top: 60, right: 20 },
  flipButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 25 },
  bottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 30,
  },
  translationContainer: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  translatedText: { fontSize: 16, color: '#1F2937', flex: 1, fontWeight: '500' },
  playButton: { padding: 8, backgroundColor: '#EBF4FF', borderRadius: 20, marginLeft: 12 },
  recordingControls: { alignItems: 'center' },
  recordButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: '#DC2626', transform: [{ scale: 1.1 }] },
});
