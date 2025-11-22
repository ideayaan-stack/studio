import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../firebase/useAuth';
import { useCollection } from '../../../firebase/useCollection';
import { collection, query, where, orderBy, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react-native';
import { format } from 'date-fns';
import AvatarWithRing from '../../../components/AvatarWithRing';

interface ChatMessage {
    id: string;
    teamId: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Timestamp;
}

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: authUser } = useAuth();
    const router = useRouter();
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Fetch user profile
    const { data: userProfiles } = useCollection<any>(
        authUser ? query(collection(db!, 'users'), where('uid', '==', authUser.uid)) : null
    );
    const userProfile = userProfiles?.[0];

    // Fetch chat title (Team Name or "Community")
    const [chatTitle, setChatTitle] = useState('Chat');
    const [chatIcon, setChatIcon] = useState<string | null>(null);

    useEffect(() => {
        if (id === 'common') {
            setChatTitle('Community');
        } else if (id && db) {
            getDoc(doc(db, 'teams', id)).then(snap => {
                if (snap.exists()) {
                    setChatTitle(snap.data().name);
                    setChatIcon(snap.data().iconURL);
                }
            });
        }
    }, [id]);

    // Messages query
    const messagesQuery = useMemo(() => {
        if (!db || !id) return null;
        return query(
            collection(db, 'messages'),
            where('teamId', '==', id),
            orderBy('timestamp', 'asc')
        );
    }, [db, id]);

    const { data: messages, loading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !id || !userProfile || !db || isSending) return;

        setIsSending(true);
        try {
            await addDoc(collection(db, 'messages'), {
                teamId: id,
                senderId: userProfile.uid,
                senderName: userProfile.displayName || 'Unknown',
                text: messageText.trim(),
                timestamp: Timestamp.now(),
                deleted: false,
                edited: false,
                reactions: {},
                readBy: {},
                replyTo: null,
            });
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
        const isOwn = item.senderId === userProfile?.uid;
        const time = item.timestamp ? format(item.timestamp.toDate(), 'HH:mm') : '';

        return (
            <View className={`mb-2 flex-row ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <View
                    className={`px-3 py-2 rounded-lg max-w-[80%] shadow-sm ${isOwn ? 'bg-[#DCF8C6] dark:bg-[#056162]' : 'bg-white dark:bg-gray-800'
                        }`}
                    style={{
                        borderTopRightRadius: isOwn ? 0 : 12,
                        borderTopLeftRadius: isOwn ? 12 : 0,
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                    }}
                >
                    {!isOwn && (
                        <Text className="text-xs font-bold text-orange-600 mb-1">{item.senderName}</Text>
                    )}
                    <Text className={`text-base ${isOwn ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.text}
                    </Text>
                    <Text className={`text-[10px] mt-1 self-end text-gray-500 dark:text-gray-400`}>
                        {time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-[#ECE5DD] dark:bg-gray-900"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-[#075E54] dark:bg-gray-800 pt-12 pb-3 px-2 flex-row items-center shadow-md z-10">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mr-2">
                    <ArrowLeft size={24} color="white" />
                    <AvatarWithRing
                        photoURL={chatIcon}
                        displayName={chatTitle}
                        email=""
                        role="Core" // Dummy
                        size="sm"
                        className="ml-1"
                    />
                </TouchableOpacity>
                <View className="flex-1 ml-2">
                    <Text className="text-lg font-bold text-white" numberOfLines={1}>{chatTitle}</Text>
                    <Text className="text-xs text-gray-200" numberOfLines={1}>
                        {id === 'common' ? 'tap for group info' : 'tap for team info'}
                    </Text>
                </View>
                <View className="flex-row space-x-4 mr-2">
                    <TouchableOpacity><Video size={24} color="white" /></TouchableOpacity>
                    <TouchableOpacity className="ml-4"><Phone size={22} color="white" /></TouchableOpacity>
                    <TouchableOpacity className="ml-4"><MoreVertical size={24} color="white" /></TouchableOpacity>
                </View>
            </View>

            {/* Chat Background & List */}
            <View className="flex-1 bg-[#ECE5DD] dark:bg-gray-900">
                {messagesLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#075E54" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}
            </View>

            {/* Input Area */}
            <View className="p-2 flex-row items-end pb-6 bg-transparent">
                <View className="flex-1 bg-white dark:bg-gray-800 rounded-full flex-row items-center px-4 py-2 mr-2 shadow-sm min-h-[48px]">
                    <TextInput
                        className="flex-1 text-base text-gray-900 dark:text-white max-h-24"
                        placeholder="Message"
                        placeholderTextColor="#9ca3af"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                </View>
                <TouchableOpacity
                    onPress={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                    className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${!messageText.trim() || isSending ? 'bg-gray-400' : 'bg-[#075E54]'
                        }`}
                >
                    <Send size={20} color="white" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
