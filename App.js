import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Platform, ActivityIndicator, Image, Linking, useWindowDimensions, TextInput, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { analyzeSwingVideo, askGolfAssistant } from './geminiEngine'; 
import * as Speech from 'expo-speech';
import { useIAP } from 'expo-iap';
import FitnessPrescription from './components/FitnessPrescription';

const SUBSCRIPTION_SKUS = ['breaking90_monthly'];

const NativeVideoPlayer = ({ uri, style }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  return (
    <VideoView
      style={style}
      player={player}
      nativeControls
      contentFit="contain"
    />
  );
};

// --- PREMIUM TRACKMAN RADAR VISUALIZER (V4) ---
const BallFlightVisualizer = ({ plane = 'Outside-In', face = 'Open' }) => {
  const [ballPos, setBallPos] = useState({x: 150, y: 220});
  const [clubPos, setClubPos] = useState({x: 150, y: 300});
  const [trail, setTrail] = useState([]);
  
  const p = String(plane).toLowerCase();
  const f = String(face).toLowerCase();

  let pathAngle = 0; 
  let pathText = "STRAIGHT";
  if (p.includes('outside') || p.includes('over')) { pathAngle = -20; pathText = "OUT-TO-IN"; }
  if (p.includes('inside') || p.includes('under')) { pathAngle = 20; pathText = "IN-TO-OUT"; }

  let faceAngle = 0; 
  let faceText = "SQUARE";
  if (f.includes('open')) { faceAngle = 15; faceText = "OPEN"; }
  if (f.includes('closed')) { faceAngle = -15; faceText = "CLOSED"; }

  const faceToPath = faceAngle - pathAngle;
  let flightName = "STRAIGHT";
  if (pathAngle < 0 && faceToPath > 0) flightName = "PULL SLICE";
  if (pathAngle < 0 && faceToPath === 0) flightName = "PULL STRAIGHT";
  if (pathAngle < 0 && faceToPath < 0) flightName = "PULL DRAW";
  if (pathAngle === 0 && faceToPath > 0) flightName = "STRAIGHT SLICE";
  if (pathAngle === 0 && faceToPath === 0) flightName = "STRAIGHT";
  if (pathAngle === 0 && faceToPath < 0) flightName = "STRAIGHT DRAW";
  if (pathAngle > 0 && faceToPath > 0) flightName = "PUSH SLICE";
  if (pathAngle > 0 && faceToPath === 0) flightName = "PUSH STRAIGHT";
  if (pathAngle > 0 && faceToPath < 0) flightName = "PUSH DRAW";

  React.useEffect(() => {
    let frame = 0;
    const totalFrames = 120;
    const impactFrame = 35; 
    let currentTrail = [];
    
    const interval = setInterval(() => {
      frame++;
      
      const clubProgress = frame / 70; 
      const cY = 320 - (280 * clubProgress);
      const cX = 150 - ((cY - 220) * Math.tan(pathAngle * Math.PI / 180));
      setClubPos({x: cX, y: cY});
      
      if (frame < impactFrame) {
        setBallPos({x: 150, y: 220});
        currentTrail = [];
        setTrail([]);
      } else {
        const ballT = (frame - impactFrame) / (totalFrames - impactFrame);
        const bY = 220 - (200 * ballT); 
        
        const initialDir = faceAngle * 1.5; 
        const curveAmt = faceToPath * 3.5; 
        const bX = 150 + (initialDir * ballT) + (curveAmt * Math.pow(ballT, 2));
        
        setBallPos({x: bX, y: bY});
        
        currentTrail.push({x: bX, y: bY});
        if (currentTrail.length > 12) currentTrail.shift();
        setTrail([...currentTrail]);
      }
      
      if (frame >= totalFrames) {
        frame = 0; 
      }
    }, 20); 
    
    return () => clearInterval(interval);
  }, [pathAngle, faceAngle]);

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: 10, paddingBottom: 20 }}>
      <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 3, marginBottom: 15 }}>
        {flightName}
      </Text>

      <View style={{ 
        width: 320, 
        height: 300, 
        backgroundColor: '#050505',
        borderRadius: 20, 
        position: 'relative', 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1A1A1A',
        alignSelf: 'center'
      }}>
        <View style={{ position: 'absolute', top: 220, left: 150, width: 100, height: 100, marginLeft: -50, marginTop: -50, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }} />
        <View style={{ position: 'absolute', top: 220, left: 150, width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }} />
        <View style={{ position: 'absolute', top: 220, left: 150, width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: 150, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }} />
        <View style={{ position: 'absolute', top: 220, left: 150, width: 400, height: 400, marginLeft: -200, marginTop: -200, borderRadius: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }} />

        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 149.5, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        
        <View style={{ 
          position: 'absolute', 
          top: 40, 
          left: 149, 
          width: 2, 
          height: 250, 
          backgroundColor: '#00D1FF', 
          opacity: 0.3, 
          transform: [{rotate: `${pathAngle}deg`}, {translateY: 20}],
          shadowColor: '#00D1FF',
          shadowOpacity: 1,
          shadowRadius: 10
        }} />

        <View style={{ position: 'absolute', top: 15, left: 15 }}>
            <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>FACE TO PATH</Text>
            <Text style={{ color: '#00FF66', fontSize: 14, fontWeight: '700' }}>{faceToPath > 0 ? '+' : ''}{(faceToPath / 3).toFixed(1)}Â°</Text>
        </View>
        <View style={{ position: 'absolute', top: 15, right: 15, alignItems: 'flex-end' }}>
            <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>CLUB PATH</Text>
            <Text style={{ color: '#00D1FF', fontSize: 14, fontWeight: '700' }}>{pathAngle > 0 ? '+' : ''}{(pathAngle / 4).toFixed(1)}Â°</Text>
        </View>

        {trail.map((pos, i) => (
            <View key={i} style={{ 
                position: 'absolute', 
                left: pos.x - 3, 
                top: pos.y - 3, 
                width: 6, 
                height: 6, 
                backgroundColor: '#00FF66', 
                borderRadius: 3, 
                opacity: (i / trail.length) * 0.6,
                transform: [{scale: i / trail.length}]
            }} />
        ))}

        <View style={{ 
          position: 'absolute', 
          left: ballPos.x - 5, 
          top: ballPos.y - 5, 
          width: 10, 
          height: 10, 
          backgroundColor: '#FFF', 
          borderRadius: 5, 
          shadowColor: '#00FF66', 
          shadowOpacity: 1, 
          shadowRadius: 12,
          zIndex: 10
        }} />

        <Image 
          source={{ uri: 'https://cdn.shopify.com/s/files/1/0252/6530/7700/files/driver-top-down.png' }}
          style={{
            position: 'absolute', 
            top: clubPos.y - 30, 
            left: clubPos.x - 30, 
            width: 60, 
            height: 60, 
            resizeMode: 'contain',
            transform: [{rotate: `${faceAngle}deg`}], 
            zIndex: 5,
            opacity: 0.9
          }}
        />
      </View>
    </View>
  );
};

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 800; 

  const [isUnlocked, setIsUnlocked] = useState(false); 
  const [currentTab, setCurrentTab] = useState('STUDIO'); 
  const [isCaddieOpen, setIsCaddieOpen] = useState(false);
  
  const [caddieInput, setCaddieInput] = useState('');
  const [caddieHistory, setCaddieHistory] = useState([
    { id: 1, role: 'ai', text: "Yo. I'm Chad, your virtual caddie. Don't ask me for a read if you're just gonna three-putt anyway. What do you need?" }
  ]);
  const [caddieLoading, setCaddieLoading] = useState(false);
  
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showOverlayVideo, setShowOverlayVideo] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [drillsCompleted, setDrillsCompleted] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [pastAnalyzes, setPastAnalyzes] = useState([]);

  const [scores, setScores] = useState([
    { id: 1, date: 'Oct 14', course: 'Pebble Beach Muni', score: 96 },
    { id: 2, date: 'Oct 08', course: 'Pine Valley Public', score: 102 }
  ]);
  const [courseInput, setCourseInput] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const {
    connected: iapConnected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
    hasActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        setIsUnlocked(true);
      } catch (error) {
        console.log('Finish purchase error:', error);
      } finally {
        setPurchaseLoading(false);
      }
    },
    onPurchaseError: (error) => {
      console.log('Purchase failed:', error);
      setPurchaseLoading(false);
      const message = error?.message || 'Purchase cancelled or failed. Please try again.';
      if (!String(message).toLowerCase().includes('cancel')) {
        Alert.alert('Purchase Failed', message);
      }
    },
  });

  const monthlySubscription = subscriptions?.find((item) => SUBSCRIPTION_SKUS.includes(item.id));
  const membershipPrice = monthlySubscription?.displayPrice || '$9.99/mo';

  useEffect(() => {
    if (!iapConnected || Platform.OS === 'web') return;

    fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }).catch((error) => {
      console.log('IAP product fetch error:', error);
    });
  }, [iapConnected, fetchProducts]);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }

    setLoadingStage(0);

    const timers = [
      setTimeout(() => setLoadingStage(1), 2500),
      setTimeout(() => setLoadingStage(2), 6000),
      setTimeout(() => setLoadingStage(3), 10000),
      setTimeout(() => setLoadingStage(4), 15000),
      setTimeout(() => setLoadingStage(5), 22000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const loadingMessages = [
    { title: 'CHAD IS WATCHING...', subtitle: 'Uploading your swing and preparing the roast.' },
    { title: 'BUILDING YOUR BREAKDOWN...', subtitle: 'Tracking posture, tempo, club path, and all the nonsense.' },
    { title: 'FINDING THE DAMAGE...', subtitle: 'Looking for the critical flaw, head movement, and tush-line violations.' },
    { title: 'PRESCRIBING THE FIX...', subtitle: 'Matching your swing issues with drills that might finally save you.' },
    { title: 'CHAD IS WRITING HIS VERDICT...', subtitle: 'This is the part where your swing gets judged without mercy.' },
    { title: 'FINALIZING ANALYSIS...', subtitle: "Almost there. Don't close the app or make eye contact with your slice." },
  ];

  const currentLoadingMessage = loadingMessages[Math.min(loadingStage, loadingMessages.length - 1)];

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hold up!', 'We need camera roll permissions.');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 15,
      quality: 0.5,
    });
    
    handleMediaResult(pickerResult);
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hold up!', 'We need camera permissions.');
      return;
    }

    let pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 15,
      quality: 0.5,
    });
    
    handleMediaResult(pickerResult);
  };

  const handleMediaResult = async (pickerResult) => {
    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setVideoUri(uri); 
      setResult(null); 
      setShowOverlayVideo(false);
      setLoading(true);
      
      try {
        const analysis = await analyzeSwingVideo(uri);
        if (!analysis || typeof analysis !== 'object' || analysis.error) {
          throw new Error(analysis?.error || 'Chad lost the connection. The server might have timed out. Try again with a shorter video (under 10 seconds).');
        }

        setResult(analysis);
        
        const newHistoryItem = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          videoUri: uri,
          result: analysis
        };
        setPastAnalyzes(prev => [newHistoryItem, ...prev]);

      } catch (error) {
        console.log('Upload Error:', error);
        
        let errorMsg = error.message;
        if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
          errorMsg = "Chad lost connection to the server. Don't close or minimize the app while the video is uploading!";
        } else if (errorMsg.includes('JSON')) {
          errorMsg = 'The AI choked on the video. Please make sure you are uploading a clear, short golf swing under 10 seconds.';
        }

        if (Platform.OS === 'web') {
          window.alert('Upload Failed: ' + errorMsg);
        } else {
          Alert.alert('Upload Failed', errorMsg);
        }
        
        setVideoUri(null); 
        setResult(null);
        setShowOverlayVideo(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const playAudioCoach = async () => {
    if (!result || audioLoading) return;
    setAudioLoading(true);
    
    try {
      const drillName = result.personalized_training_plan?.[0]?.drill_name || 'a basic drill';
      const drillFocus = result.personalized_training_plan?.[0]?.what_to_feel || 'just hitting it straight';
      
      const roastIntros = [
        'Yo bro. The verdict is in.',
        "Alright dude. Let's look at this disaster.",
        "Man, I don't know what you were thinking here.",
        "Okay big guy. Let's break this down.",
        "Let's get right into it, partner.",
      ];
      
      const roastOutros = [
        "If you wanna stop chunking it in front of the cart girl, we gotta fix this.",
        "If we don't fix this, you're gonna keep donating Pro V1s to the woods.",
        "Let's fix this so your buddies stop laughing behind your back on the tee box.",
        'We gotta get this sorted before you break another club in anger.',
        'Fix this, or just sell your clubs on Facebook Marketplace right now.',
        "This is why you're still buying mulligans on the first tee.",
      ];
      
      const randomIntro = roastIntros[Math.floor(Math.random() * roastIntros.length)];
      const randomOutro = roastOutros[Math.floor(Math.random() * roastOutros.length)];
      
      const script = `${randomIntro} ${result.savage_mode} Seriously dude, your critical flaw is ${result.the_critical_flaw}. ${randomOutro} We're gonna run the ${drillName}. Focus up bro: ${drillFocus}. Let's get to work, let's go.`;
      Speech.speak(script, {
        language: 'en-GB',
        pitch: 0.9,
        rate: 1.05
      });

    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Audio Error: ' + error.message);
      } else {
        Alert.alert('Audio Error', error.message);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const openLink = (url) => { if (url) Linking.openURL(url).catch(err => console.error(err)); };

  const startMembershipTrial = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('iPhone Required', 'Free trials and memberships are handled by Apple in the iPhone app build.');
      return;
    }

    if (!iapConnected) {
      Alert.alert('Store Not Ready', 'Apple purchases are still connecting. Please try again in a moment.');
      return;
    }

    setPurchaseLoading(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: SUBSCRIPTION_SKUS[0] },
          google: { skus: SUBSCRIPTION_SKUS },
        },
        type: 'subs',
      });
    } catch (error) {
      setPurchaseLoading(false);
      Alert.alert('Purchase Failed', error?.message || 'Unable to start the membership purchase.');
    }
  };

  const restoreMembership = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('iPhone Required', 'Purchase restore is available in the iPhone app build.');
      return;
    }

    try {
      const hasActiveMembership = await hasActiveSubscriptions(SUBSCRIPTION_SKUS);
      if (hasActiveMembership) {
        setIsUnlocked(true);
        Alert.alert('Restored', 'Your Breaking 90 membership is active.');
        return;
      }

      await restorePurchases();
      Alert.alert('No Active Membership', 'No active Breaking 90 membership was found for this Apple ID.');
    } catch (error) {
      Alert.alert('Restore Failed', error?.message || 'Unable to restore purchases right now.');
    }
  };

  const logScore = () => {
    if (!scoreInput) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      course: courseInput || 'Local Course',
      score: parseInt(scoreInput)
    };
    setScores([newEntry, ...scores]);
    setCourseInput(''); setScoreInput('');
  };

  const askCaddie = async () => {
    if (!caddieInput.trim()) return;
    const userQ = caddieInput;
    setCaddieInput('');
    const newHistory = [...caddieHistory, { id: Date.now(), role: 'user', text: userQ }];
    setCaddieHistory(newHistory);
    setCaddieLoading(true);

    try {
      const aiResponse = await askGolfAssistant(userQ);
      setCaddieHistory([...newHistory, { id: Date.now() + 1, role: 'ai', text: aiResponse }]);
    } catch (error) {
      setCaddieHistory([...newHistory, { id: Date.now() + 1, role: 'ai', text: 'Man, my radio cut out. Ask me again.' }]);
    } finally {
      setCaddieLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.paywallContainer} style={{ width: '100%', alignSelf: 'center' }}>
          <View style={styles.paywallLogoContainer}>
            <Image source={require('./assets/icon.png')} style={styles.paywallLogo} />
          </View>
          <Text style={styles.paywallTitle}>BREAKING 90</Text>
          <Text style={styles.paywallSub}>Your personal PGA-level biomechanics coach.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', marginBottom: 30 }} contentContainerStyle={{ paddingHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={styles.featureCard}>
                <Text style={styles.bioHighlight}>WHY "BREAKING 90"?</Text>
                <Text style={styles.bioText}>Empowering golfers to break 90 and have a blast doing itâ€”our app delivers expert swing analysis, practical improvement tools, and a healthy dose of good-natured roasting. We believe the path to better scores is paved with honest feedback and a sense of humor. #RoastAndRoarUnder90</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.bioHighlight}>TRACK YOUR SCORES</Text>
                <Text style={styles.bioText}>The scorecard never lies. Stop guessing your handicap. Log your rounds seamlessly and track your improvement to see if Chad's brutal roasts are actually translating to lower scores out on the course.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.bioHighlight}>THE PLAYERS CLUB</Text>
                <Text style={styles.bioText}>Join the ultimate members-only forum. Talk trash, share your absolute worst swings, and find drills that actually work. Roast your buddies and get roasted by the rest of the Breaking 90 community.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.bioHighlight}>EXCLUSIVE PRO SHOP</Text>
                <Text style={styles.bioText}>Look good, play slightly less terrible. Members get exclusive, early access to our limited-drop performance polos, hats, and hoodies. Premium gear for golfers who don't take themselves too seriously.</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.pricingBox}>
            <Text style={styles.pricingHeadline}>Unlock Elite Analysis</Text>
            <View style={styles.pricingList}>
              <Text style={styles.pricingItem}>âœ“ Swing Critiques (Roasts) to better your all around game</Text>
              <Text style={styles.pricingItem}>âœ“ Frame-by-Frame Biomechanics</Text>
              <Text style={styles.pricingItem}>âœ“ Custom Youtube Drill Library</Text>
              <Text style={styles.pricingItem}>âœ“ Performance & Score Tracking</Text>
            </View>
            <View style={styles.trialHighlight}><Text style={styles.trialHighlightText}>3 DAYS FREE</Text></View>
            <Text style={styles.pricingTerms}>Then {membershipPrice}. Cancel anytime through Apple.</Text>
          </View>
          <TouchableOpacity style={styles.paywallBtn} onPress={startMembershipTrial} disabled={purchaseLoading}>
            <Text style={styles.paywallBtnText}>{purchaseLoading ? 'CONNECTING TO APPLE...' : 'START FREE TRIAL'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginBtn} onPress={restoreMembership}>
            <Text style={styles.loginBtnText}>Already a member? Restore Purchase</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogoContainer}>
              <Image source={require('./assets/icon.png')} style={styles.headerLogo} />
            </View>
            <Text style={styles.headerTitle}>BREAKING 90</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsUnlocked(false)}>
              <Text style={styles.versionText}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabBtn, currentTab === 'STUDIO' && styles.activeTabBtn]} onPress={() => setCurrentTab('STUDIO')}>
            <Text style={[styles.tabText, currentTab === 'STUDIO' && styles.activeTabText]}>GOLF ANALYSIS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, currentTab === 'PROFILE' && styles.activeTabBtn]} onPress={() => setCurrentTab('PROFILE')}>
            <Text style={[styles.tabText, currentTab === 'PROFILE' && styles.activeTabText]}>MY SCORES & LIBRARY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, currentTab === 'COMMUNITY' && styles.activeTabBtn]} onPress={() => setCurrentTab('COMMUNITY')}>
            <Text style={[styles.tabText, currentTab === 'COMMUNITY' && styles.activeTabText]}>THE PLAYERS CLUB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, currentTab === 'SHOP' && styles.activeTabBtn]} onPress={() => setCurrentTab('SHOP')}>
            <Text style={[styles.tabText, currentTab === 'SHOP' && styles.activeTabText]}>PRO SHOP</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentTab === 'STUDIO' && (
            <View style={{ flex: 1 }}>
              <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
                <View style={[styles.column, isDesktop && styles.columnDesktop]}>
                  <Text style={styles.headlineText}>UPLOAD YOUR <Text style={styles.neonText}>MEDIOCRITY.</Text></Text>
                  <Text style={styles.subText}>Elite analysis for those who dare to be roasted.</Text>

                  <TouchableOpacity style={styles.uploadBox} activeOpacity={1}>
                    {!videoUri ? (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={styles.uploadBoxTitle}>Drop your swing video here</Text>
                        <Text style={styles.uploadBoxSub}>Select a video or record a live swing</Text>
                        <View style={[styles.actionBtnRow, { flexDirection: 'column', alignItems: 'center', gap: 20 }]}>
                          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLive, { width: 250, alignItems: 'center' }]} onPress={recordVideo} disabled={loading}>
                            <Text style={styles.actionBtnTextLive}>ðŸ”´ RECORD LIVE SWING</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { width: 250, alignItems: 'center' }]} onPress={pickVideo} disabled={loading}>
                            <Text style={styles.actionBtnText}>ðŸ“ UPLOAD FROM CAMERA ROLL</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.videoContainer}>
                        {Platform.OS === 'web' ? (
                          <video
                            src={showOverlayVideo && result?.overlay_available && result?.skeleton_video_url ? result.skeleton_video_url : videoUri}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'black' }}
                            controls
                            autoPlay
                            loop
                          />
                        ) : (
                          <NativeVideoPlayer
                            key={showOverlayVideo && result?.overlay_available && result?.skeleton_video_url ? result.skeleton_video_url : videoUri}
                            style={styles.videoPlayer}
                            uri={showOverlayVideo && result?.overlay_available && result?.skeleton_video_url ? result.skeleton_video_url : videoUri}
                          />
                        )}

                        {result?.overlay_available && result?.skeleton_video_url && !loading && (
                          <TouchableOpacity style={styles.overlayToggleBtn} onPress={() => setShowOverlayVideo(!showOverlayVideo)}>
                            <Text style={styles.overlayToggleText}>
                              {showOverlayVideo ? 'Show Original Video' : 'Show Skeleton Overlay'}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {!loading && (
                          <TouchableOpacity
                            style={styles.changeVideoOverlay}
                            onPress={() => {
                              if (result && !drillsCompleted) {
                                if (Platform.OS === 'web') {
                                  window.alert("CHAD SAYS NO: Do your damn workouts. Check the completion box at the bottom of your analysis before uploading another swing.");
                                } else {
                                  Alert.alert('CHAD SAYS NO', 'Do your damn workouts. Check the completion box at the bottom of your analysis before uploading another swing.');
                                }
                                return;
                              }
                              setVideoUri(null);
                              setResult(null);
                              setShowOverlayVideo(false);
                              setDrillsCompleted(false);
                            }}
                          >
                            <Text style={styles.changeVideoText}>Tap to Change Video</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={[styles.column, isDesktop && styles.columnDesktop]}>
                  {!videoUri && !loading && !result && (
                    <View style={styles.awaitingContainer}>
                      <View style={styles.awaitingCircle}><Text style={styles.cameraIcon}>ðŸ“¹</Text></View>
                      <Text style={styles.awaitingTitle}>AWAITING INPUT</Text>
                      <View style={{ marginTop: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 15, borderRadius: 8, width: '90%', maxWidth: 300 }}>
                        <Text style={{ color: '#00FF66', fontWeight: 'bold', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>CHAD'S PRO TIPS</Text>
                        <Text style={{ color: '#AAAAAA', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>â€¢ Keep the video under 10 seconds.</Text>
                        <Text style={{ color: '#AAAAAA', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>â€¢ Trim the fat: show only the actual swing.</Text>
                        <Text style={{ color: '#AAAAAA', fontSize: 11, textAlign: 'center' }}>â€¢ Film directly "Face-On" or "Down-the-Line".</Text>
                      </View>
                    </View>
                  )}

                  {loading && (
                    <View style={styles.awaitingContainer}>
                      <ActivityIndicator size="large" color="#00FF66" style={{ marginBottom: 20 }} />
                      <Text style={[styles.awaitingTitle, { color: '#00FF66', textAlign: 'center' }]}>{currentLoadingMessage.title}</Text>
                      <Text style={[styles.awaitingSub, { maxWidth: 320, marginTop: 10 }]}>{currentLoadingMessage.subtitle}</Text>

                      <View style={styles.loadingProgressWrap}>
                        <View style={[styles.loadingProgressFill, { width: `${Math.min(15 + loadingStage * 17, 95)}%` }]} />
                      </View>

                      <View style={styles.loadingTipBox}>
                        <Text style={styles.loadingTipTitle}>PRO TIP</Text>
                        <Text style={styles.loadingTipText}>For fastest results, upload only the swing itself â€” 3 to 5 seconds is money.</Text>
                      </View>
                    </View>
                  )}

                  {result && !loading && (
                    <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
                      <TouchableOpacity style={styles.audioBtn} onPress={playAudioCoach} disabled={audioLoading}>
                        {audioLoading ? (
                          <Text style={[styles.audioBtnText, {color: '#888'}]}>â³ GENERATING AI AUDIO...</Text>
                        ) : (
                          <Text style={styles.audioBtnText}>ðŸŽ§ LISTEN TO AUDIO COACH</Text>
                        )}
                      </TouchableOpacity>

                      <View style={styles.verdictCard}>
                        <Text style={styles.verdictHeader}>THE VERDICT</Text>
                        <Text style={styles.verdictText}>"{String(result.savage_mode || 'AI held back...')}"</Text>
                      </View>

                      {result.swing_summary && (
                        <>
                          <View style={styles.statsRow}>
                            <View style={styles.statBox}><Text style={styles.statIcon}>ðŸ›¡</Text><Text style={styles.statLabel}>POSTURE</Text><Text style={styles.statValue}>{String(result.swing_summary.posture_score || '-')}</Text></View>
                            <View style={styles.statBox}><Text style={styles.statIcon}>âš¡</Text><Text style={styles.statLabel}>TEMPO</Text><Text style={styles.statValue}>{String(result.swing_summary.tempo || '-')}</Text></View>
                            <View style={styles.statBox}><Text style={styles.statIcon}>ðŸŽ¯</Text><Text style={styles.statLabel}>OUTCOME</Text><Text style={styles.statValue}>{String(result.swing_summary.estimated_outcome || '-')}</Text></View>
                          </View>
                          <View style={styles.statsRow}>
                            <View style={styles.statBox}><Text style={styles.statIcon}>ðŸ“</Text><Text style={styles.statLabel}>SWING PLANE</Text><Text style={styles.statValue}>{String(result.swing_summary.swing_plane || 'Over Top')}</Text></View>
                            <View style={styles.statBox}><Text style={styles.statIcon}>ðŸª“</Text><Text style={styles.statLabel}>CLUBFACE</Text><Text style={styles.statValue}>{String(result.swing_summary.clubface_angle || 'Open')}</Text></View>
                            <View style={styles.statBox}><Text style={styles.statIcon}>ðŸ§</Text><Text style={styles.statLabel}>HIP DEPTH</Text><Text style={styles.statValue}>{String(result.swing_summary.hip_depth || 'Loss')}</Text></View>
                          </View>
                        </>
                      )}

                      <View style={styles.feedbackColumn}>
                        <View style={[styles.feedbackBox, styles.goodBox, { marginBottom: 15 }]}>
                          <Text style={styles.goodHeader}>ðŸ† THE GOOD</Text>
                          <Text style={styles.goodText}>{String(result.the_good || 'Not much to be honest.')}</Text>
                        </View>
                        <View style={[styles.feedbackBox, styles.badBox]}>
                          <Text style={styles.badHeader}>âš  THE CRITICAL FLAW</Text>
                          <Text style={styles.badText}>{String(result.the_critical_flaw || 'Everything.')}</Text>
                        </View>
                      </View>

                      {Array.isArray(result.step_by_step_analysis) && result.step_by_step_analysis.length > 0 && (
                        <View style={styles.breakdownContainer}>
                          <Text style={styles.sectionHeadline}>BIOMECHANICAL BREAKDOWN</Text>
                          {result.step_by_step_analysis.map((step, idx) => (
                            <View key={idx} style={styles.breakdownRow}>
                              <Text style={styles.breakdownNumber}>0{idx + 1}</Text>
                              <Text style={styles.breakdownText}>{String(step)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      <Text style={styles.sectionHeadline}>PRESCRIPTION (DRILLS)</Text>
                      {Array.isArray(result.personalized_training_plan) ? result.personalized_training_plan.map((drill, idx) => {
                        const safeName = drill.drill_name ? String(drill.drill_name) : 'Golf';
                        const ytLink = drill.youtube_search_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(safeName + ' drill')}`;
                        return (
                        <View key={idx} style={styles.drillCard}>
                          <Text style={styles.drillName}>{safeName.toUpperCase()} <Text style={styles.drillLocation}>// {String(drill.location || 'ANYWHERE').toUpperCase()}</Text></Text>
                          <Text style={styles.drillDesc}>{String(drill.how_to_do_it || '')}</Text>
                          <View style={styles.feelBox}><Text style={styles.drillFeel}>FOCUS: {String(drill.what_to_feel || '')}</Text></View>
                          <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(ytLink)}><Text style={styles.linkBtnText}>â–¶ WATCH "{safeName.toUpperCase()}" ON YOUTUBE</Text></TouchableOpacity>
                        </View>
                      )}) : null}

                      <FitnessPrescription data={
                        result.fitness_prescription ? result : {
                          physical_diagnosis: 'Your thoracic spine has the mobility of a rusty hinge. You are standing up early to compensate because your body physically can\'t rotate.',
                          fitness_prescription: [
                            {
                              exercise_name: 'Seated Thoracic Rotations',
                              sets_and_reps: '3 sets of 15 / side',
                              why_it_helps: 'Unlocks your mid-back so you can actually turn instead of swaying like a tree in the wind.'
                            },
                            {
                              exercise_name: 'Glute Bridges',
                              sets_and_reps: '3 sets of 20',
                              why_it_helps: 'Wakes up your dead glutes so you can maintain posture through impact.'
                            }
                          ]
                        }
                      } />

                      <TouchableOpacity 
                        style={[styles.completedBtn, drillsCompleted && styles.completedBtnActive]} 
                        onPress={() => setDrillsCompleted(!drillsCompleted)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.completedBtnText, drillsCompleted && { color: '#121212' }]}>
                          {drillsCompleted ? 'âœ… DRILLS COMPLETED' : 'â¬œ I HAVE DONE MY DRILLS'}
                        </Text>
                      </TouchableOpacity>
                      
                      <View style={{height: 40}} />
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>
          )}

          {currentTab === 'PROFILE' && (
            <View style={styles.profileContainer}>
              <Text style={styles.headlineText}>TRACK YOUR <Text style={styles.neonText}>PROGRESS.</Text></Text>
              <Text style={styles.subText}>The scorecard never lies.</Text>
              <View style={styles.logRoundBox}>
                <Text style={styles.sectionHeadline}>LOG A ROUND</Text>
                <View style={styles.formRow}>
                  <TextInput style={styles.input} placeholder="Course Name (e.g. Pebble Beach)" placeholderTextColor="#666" value={courseInput} onChangeText={setCourseInput} />
                  <TextInput style={styles.inputScore} placeholder="Score" placeholderTextColor="#666" keyboardType="numeric" value={scoreInput} onChangeText={setScoreInput} maxLength={3} />
                  <TouchableOpacity style={styles.logBtn} onPress={logScore}><Text style={styles.logBtnText}>+ ADD</Text></TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionHeadline}>RECENT ROUNDS</Text>
              {scores.length === 0 ? (
                <Text style={styles.bioText}>No rounds logged yet. Get out there and play.</Text>
              ) : (
                scores.map((s) => (
                  <View key={s.id} style={styles.scoreRowCard}>
                    <View style={styles.scoreRowLeft}>
                      <Text style={styles.scoreCourse}>{s.course}</Text>
                      <Text style={styles.scoreDate}>{s.date}</Text>
                    </View>
                    <View style={[styles.scoreCircle, s.score < 90 ? styles.scoreCircleGood : styles.scoreCircleBad]}>
                      <Text style={[styles.scoreNumber, s.score < 90 ? styles.scoreNumberGood : styles.scoreNumberBad]}>{s.score}</Text>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionHeadline, { marginTop: 40 }]}>SWING VAULT</Text>
              {pastAnalyzes.length === 0 ? (
                <Text style={styles.bioText}>No swings recorded yet. Upload a video in Golf Analysis to build your vault.</Text>
              ) : (
                pastAnalyzes.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.scoreRowCard, { borderColor: '#00FF66', borderLeftWidth: 4 }]}
                    onPress={() => {
                       setVideoUri(item.videoUri);
                       setResult(item.result);
                       setShowOverlayVideo(false);
                       setCurrentTab('STUDIO');
                    }}
                  >
                    <View style={styles.scoreRowLeft}>
                      <Text style={styles.scoreCourse}>{item.result?.detected_club || 'Unknown Club'} Swing</Text>
                      <Text style={styles.scoreDate}>{item.date}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1A1A1A', padding: 10, borderRadius: 10 }}>
                      <Text style={{ color: '#00FF66', fontWeight: 'bold' }}>REVIEW â–¶</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {currentTab === 'COMMUNITY' && (
            <View style={styles.profileContainer}>
              <Text style={styles.headlineText}>THE <Text style={styles.neonText}>CLUBHOUSE.</Text></Text>
              <Text style={styles.subText}>Roast each other. Share drills. Talk trash.</Text>
              <View style={styles.logRoundBox}>
                <Text style={styles.sectionHeadline}>POST TO FORUM</Text>
                <View style={[styles.formRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <TextInput style={[styles.input, { width: '100%', marginBottom: 15, height: 100, textAlignVertical: 'top' }]} placeholder="What's on your mind? Did you shank it into a house?" placeholderTextColor="#666" multiline />
                  <TouchableOpacity style={styles.logBtn} onPress={() => Alert.alert('Posted!', 'Your trash talk has been published.')}>
                    <Text style={styles.logBtnText}>SEND IT ðŸš€</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.sectionHeadline}>RECENT POSTS</Text>
              <View style={styles.drillCard}>
                <Text style={styles.drillName}>Dave M. <Text style={styles.drillLocation}>// 2 HOURS AGO</Text></Text>
                <Text style={styles.drillDesc}>Just got roasted by Chad for my chicken wing. Honestly, he wasn't wrong. Any good drills for keeping the left arm straight?</Text>
                <View style={styles.feelBox}><Text style={styles.drillFeel}>3 REPLIES â€¢ 12 LIKES</Text></View>
              </View>
              <View style={styles.drillCard}>
                <Text style={styles.drillName}>Sarah T. <Text style={styles.drillLocation}>// 5 HOURS AGO</Text></Text>
                <Text style={styles.drillDesc}>Shot an 88 today! The posture drills actually work. Suck it, Chad!</Text>
                <View style={styles.feelBox}><Text style={styles.drillFeel}>14 REPLIES â€¢ 89 LIKES</Text></View>
              </View>
            </View>
          )}

          {currentTab === 'SHOP' && (
            <View style={styles.profileContainer}>
              <Text style={styles.headlineText}>EXCLUSIVE <Text style={styles.neonText}>GEAR.</Text></Text>
              <Text style={styles.subText}>Look good. Play slightly less terrible.</Text>
              <View style={[styles.awaitingContainer, { minHeight: 400, backgroundColor: '#0A0A0A', borderRadius: 20, borderWidth: 1, borderColor: '#222', padding: 20 }]}> 
                <Text style={[styles.awaitingTitle, { color: '#FFF', marginBottom: 20 }]}>THE PRO SHOP IS DROPPING SOON</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 15, paddingRight: 20 }}>
                    <Image source={require('./assets/merch1.jpg')} style={styles.merchImage} />
                    <Image source={require('./assets/merch2.jpg')} style={styles.merchImage} />
                    <Image source={require('./assets/merch3.jpg')} style={styles.merchImage} />
                    <Image source={require('./assets/merch4.png')} style={styles.merchImage} />
                    <Image source={require('./assets/merch5.jpg')} style={styles.merchImage} />
                  </View>
                </ScrollView>
                <Text style={[styles.awaitingSub, { color: '#888', maxWidth: 400 }]}>Members-only performance polos, hats, and hoodies are currently in production. Check back soon for the first drop.</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {isCaddieOpen && (
          <View style={styles.floatingCaddieBox}>
            <View style={styles.caddieHeader}>
              <Text style={styles.caddieHeaderTitle}>ASK CHAD</Text>
              <TouchableOpacity onPress={() => setIsCaddieOpen(false)}>
                <Text style={styles.caddieCloseText}>âœ•</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.caddieScroll} contentContainerStyle={{ paddingBottom: 20 }}>
              {caddieHistory.map((msg) => (
                <View key={msg.id} style={[styles.caddieMsgRow, msg.role === 'user' ? styles.caddieRowUser : styles.caddieRowAi]}>
                  {msg.role === 'ai' && <Text style={styles.caddieAvatar}>â›³ï¸</Text>}
                  <View style={[styles.caddieBubble, msg.role === 'user' ? styles.caddieBubbleUser : styles.caddieBubbleAi]}>
                    <Text style={[styles.caddieText, msg.role === 'user' && {color: '#000'}]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
              {caddieLoading && (
                <View style={[styles.caddieMsgRow, styles.caddieRowAi]}>
                  <Text style={styles.caddieAvatar}>â›³ï¸</Text>
                  <View style={[styles.caddieBubble, styles.caddieBubbleAi]}><ActivityIndicator size="small" color="#00FF66" /></View>
                </View>
              )}
            </ScrollView>
            <View style={styles.caddieInputRow}>
              <TextInput style={styles.caddieInputText} placeholder="Ask a golf question..." placeholderTextColor="#666" value={caddieInput} onChangeText={setCaddieInput} onSubmitEditing={askCaddie} />
              <TouchableOpacity style={styles.caddieSendBtn} onPress={askCaddie} disabled={caddieLoading}>
                <Text style={styles.caddieSendBtnText}>â†‘</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isCaddieOpen && (
          <TouchableOpacity style={styles.floatingCaddieBtn} onPress={() => setIsCaddieOpen(true)}>
            <Text style={styles.floatingCaddieBtnText}>â›³ï¸</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  paywallContainer: { width: '100%', maxWidth: 500, padding: 30, alignItems: 'center' },
  paywallLogoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  paywallLogo: { width: '120%', height: '120%', resizeMode: 'cover' },
  paywallTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 5 },
  paywallSub: { fontSize: 16, color: '#888888', marginBottom: 40, textAlign: 'center' },
  pricingBox: { backgroundColor: '#0A0A0A', width: '100%', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#222', alignItems: 'center', marginBottom: 30 },
  pricingHeadline: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  pricingList: { width: '100%', marginBottom: 25 },
  pricingItem: { color: '#CCC', fontSize: 16, marginBottom: 10 },
  trialHighlight: { backgroundColor: '#1A0505', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: '#FF453A', marginBottom: 15 },
  trialHighlightText: { color: '#FF453A', fontWeight: '900', letterSpacing: 1 },
  pricingTerms: { color: '#666', fontSize: 14 },
  paywallBtn: { backgroundColor: '#00FF66', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', shadowColor: '#00FF66', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, marginBottom: 20 },
  paywallBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  loginBtn: { padding: 10 },
  loginBtnText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' },
  featureCard: { width: 300, backgroundColor: '#0A0A0A', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogoContainer: { width: 40, height: 40, borderRadius: 20, marginRight: 15, backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  headerLogo: { width: '120%', height: '120%', resizeMode: 'cover' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  headerRight: { padding: 5 }, 
  versionText: { color: '#666666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#0A0A0A' },
  tabBtn: { flex: 1, paddingVertical: 18, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent', borderRightWidth: 1, borderRightColor: '#222' },
  activeTabBtn: { borderBottomColor: '#00FF66', backgroundColor: '#111' },
  tabText: { color: '#666', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  activeTabText: { color: '#00FF66' },
  scrollContent: { padding: 30, paddingBottom: 60, flexGrow: 1 },
  mainLayout: { flexDirection: 'column', gap: 40, flex: 1 },
  mainLayoutDesktop: { flexDirection: 'row', gap: 60 },
  column: { flex: 1 },
  columnDesktop: { maxWidth: '50%' },
  headlineText: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, textTransform: 'uppercase' },
  neonText: { color: '#00FF66', fontStyle: 'italic' },
  subText: { color: '#888888', fontSize: 18, marginTop: 10, marginBottom: 20 },
  bioHighlight: { color: '#00D189', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 15, textAlign: 'center' },
  bioText: { color: '#CCCCCC', fontSize: 16, lineHeight: 28, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  uploadBox: { backgroundColor: '#0A0A0A', borderRadius: 20, borderWidth: 2, borderColor: '#333333', borderStyle: 'dashed', height: 400, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadPlaceholder: { alignItems: 'center', padding: 20, width: '100%' },
  uploadBoxTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  uploadBoxSub: { color: '#666666', fontSize: 14, marginBottom: 30 },
  actionBtnRow: { flexDirection: 'row', gap: 15, width: '100%', justifyContent: 'center' },
  actionBtn: { backgroundColor: '#1A1A1A', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12, borderWidth: 1, borderColor: '#333333' },
  actionBtnLive: { backgroundColor: '#1A0505', borderColor: '#FF453A' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 1, fontSize: 14 },
  actionBtnTextLive: { color: '#FF453A', fontWeight: '900', letterSpacing: 1, fontSize: 14 },
  videoContainer: { width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' },
  videoPlayer: { width: '100%', height: '100%' },
  changeVideoOverlay: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  changeVideoText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  overlayToggleBtn: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#00FF66' },
  overlayToggleText: { color: '#00FF66', fontSize: 12, fontWeight: 'bold' },
  awaitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 450 },
  awaitingCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#333333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  cameraIcon: { fontSize: 30, color: '#666' },
  awaitingTitle: { color: '#444444', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  awaitingSub: { color: '#444444', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  loadingProgressWrap: { width: '85%', maxWidth: 320, height: 10, backgroundColor: '#1A1A1A', borderRadius: 999, overflow: 'hidden', marginTop: 22, borderWidth: 1, borderColor: '#333' },
  loadingProgressFill: { height: '100%', backgroundColor: '#00FF66', borderRadius: 999 },
  loadingTipBox: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, width: '85%', maxWidth: 340 },
  loadingTipTitle: { color: '#00FF66', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  loadingTipText: { color: '#AAAAAA', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  resultsContainer: { flex: 1, paddingTop: 10 },
  audioBtn: { backgroundColor: '#333333', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  audioBtnText: { color: '#00FF66', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  verdictCard: { backgroundColor: '#00D189', padding: 25, borderRadius: 20, marginBottom: 25 },
  verdictHeader: { color: '#005536', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  verdictText: { color: '#000000', fontSize: 22, fontWeight: '800', fontStyle: 'italic', letterSpacing: -0.5, lineHeight: 28 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  statBox: { flex: 1, backgroundColor: '#0A0A0A', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#222222' },
  statIcon: { fontSize: 16, color: '#00D189', marginBottom: 10 },
  statLabel: { color: '#666666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  feedbackColumn: { flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 40, width: '100%' },
  feedbackBox: { flex: 1, backgroundColor: '#0A0A0A', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222222' },
  goodHeader: { color: '#00D189', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  goodText: { color: '#EEEEEE', fontSize: 16, lineHeight: 24 },
  badHeader: { color: '#FF453A', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  badText: { color: '#FF6B6B', fontSize: 18, fontWeight: 'bold', lineHeight: 26 },
  sectionHeadline: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 25, textTransform: 'uppercase' },
  breakdownContainer: { marginBottom: 40 },
  breakdownRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222222' },
  breakdownNumber: { color: '#00D189', fontSize: 16, fontWeight: '900', marginRight: 20, width: 25 },
  breakdownText: { color: '#CCCCCC', fontSize: 16, lineHeight: 24, flex: 1 },
  drillCard: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#222222', marginBottom: 20 },
  drillName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  drillLocation: { color: '#666666', fontWeight: 'bold' },
  drillDesc: { color: '#AAAAAA', fontSize: 16, lineHeight: 24, marginBottom: 15 },
  feelBox: { backgroundColor: '#111111', padding: 15, borderRadius: 8, borderLeftWidth: 2, borderLeftColor: '#00FF66', marginBottom: 20 },
  drillFeel: { color: '#00FF66', fontSize: 14, fontWeight: 'bold', fontStyle: 'italic', letterSpacing: 0.5 },
  linkBtn: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  linkBtnText: { color: '#000000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  completedBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#333333', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  completedBtnActive: { backgroundColor: '#00FF66', borderColor: '#00FF66' },
  completedBtnText: { color: '#888888', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  profileContainer: { flex: 1, maxWidth: 800, alignSelf: 'center', width: '100%' },
  logRoundBox: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginBottom: 40 },
  formRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  input: { flex: 2, backgroundColor: '#1A1A1A', color: '#FFF', padding: 18, borderRadius: 10, fontSize: 16 },
  inputScore: { flex: 1, backgroundColor: '#1A1A1A', color: '#FFF', padding: 18, borderRadius: 10, fontSize: 16, textAlign: 'center' },
  logBtn: { flex: 1, backgroundColor: '#00D189', padding: 18, borderRadius: 10, alignItems: 'center' },
  logBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  scoreRowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 25, borderRadius: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#333' },
  scoreRowLeft: { flex: 1 },
  scoreCourse: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  scoreDate: { color: '#888', fontSize: 14 },
  scoreCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreCircleGood: { borderColor: '#00FF66', backgroundColor: '#003311' },
  scoreCircleBad: { borderColor: '#FF453A', backgroundColor: '#330A0A' },
  scoreNumber: { fontSize: 22, fontWeight: '900' },
  scoreNumberGood: { color: '#00FF66' },
  scoreNumberBad: { color: '#FF453A' },
  merchImage: { width: 300, height: 400, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  floatingCaddieBtn: { position: 'absolute', bottom: 30, right: 30, width: 65, height: 65, borderRadius: 35, backgroundColor: '#00FF66', justifyContent: 'center', alignItems: 'center', shadowColor: '#00FF66', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, zIndex: 1000 },
  floatingCaddieBtnText: { fontSize: 30 },
  floatingCaddieBox: { position: 'absolute', bottom: 110, right: 30, width: 350, height: 500, backgroundColor: '#0A0A0A', borderRadius: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, zIndex: 1000 },
  caddieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  caddieHeaderTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  caddieCloseText: { color: '#888', fontSize: 20, fontWeight: 'bold' },
  caddieScroll: { flex: 1, padding: 15 },
  caddieMsgRow: { flexDirection: 'row', marginBottom: 15 },
  caddieRowUser: { justifyContent: 'flex-end' },
  caddieRowAi: { justifyContent: 'flex-start', paddingRight: 30 },
  caddieAvatar: { fontSize: 20, marginRight: 8, marginTop: 5 },
  caddieBubble: { padding: 12, borderRadius: 15, maxWidth: '90%' },
  caddieBubbleUser: { backgroundColor: '#00FF66', borderBottomRightRadius: 5 },
  caddieBubbleAi: { backgroundColor: '#1A1A1A', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#333' },
  caddieText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  caddieInputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center' },
  caddieInputText: { flex: 1, backgroundColor: '#000', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', fontSize: 14 },
  caddieSendBtn: { backgroundColor: '#00FF66', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  caddieSendBtnText: { color: '#000', fontWeight: '900', fontSize: 18 }
});
