import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, SafeAreaView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../firebase/useAuth';
import { useCollection } from '../../../firebase/useCollection';
import { collection, query, where, orderBy, addDoc, Timestamp, doc, getDoc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Trash2, Edit2, Copy, Reply, X } from 'lucide-react-native';
import { format } from 'date-fns';
import AvatarWithRing from '../../../components/AvatarWithRing';
import * as Clipboard from 'expo-clipboard';
import { FlashList } from '@shopify/flash-list';
import { useHeaderHeight } from '@react-navigation/elements';

interface ChatMessage {
    id: string;
    teamId: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Timestamp;
    deleted?: boolean;
    edited?: boolean;
    reactions?: Record<string, string[]>;
    readBy?: Record<string, Timestamp>;
    replyTo?: {
        messageId: string;
        senderName: string;
        text: string;
    } | null;
}

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: authUser } = useAuth();
    const router = useRouter();
    const headerHeight = useHeaderHeight();

    // State
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [reactionModalVisible, setReactionModalVisible] = useState(false);
    const [activeMessageForReaction, setActiveMessageForReaction] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<{ messageId: string; senderName: string; text: string } | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    // Profile
    const { data: userProfiles } = useCollection<any>(
        authUser ? query(collection(db!, 'users'), where('uid', '==', authUser.uid)) : null
    );
    const userProfile = userProfiles?.[0];

    // Chat Info
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

    // Query - INVERTED Logic: Descending order (newest first)
    // This works perfectly with FlashList inverted={true}
    const messagesQuery = useMemo(() => {
        if (!db || !id) return null;
        return query(
            collection(db, 'messages'),
            where('teamId', '==', id),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
    }, [db, id]);

    const { data: messages, loading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);

    // Mark as read (only for newest messages that aren't mine)
    useEffect(() => {
        if (!db || !id || !userProfile?.uid || !messages) return;

        // Inverted list: index 0 is newest. distinct from FlatList logic.
        const unreadMessages = messages.filter(msg =>
            !msg.deleted &&
            msg.senderId !== userProfile.uid &&
            (!msg.readBy || !msg.readBy[userProfile.uid])
        );

        if (unreadMessages.length > 0) {
            const batch = writeBatch(db);
            unreadMessages.forEach(msg => {
                const msgRef = doc(db, 'messages', msg.id);
                const existingReadBy = msg.readBy || {};
                // Only update if not already there (client-side check optimization)
                if (!existingReadBy[userProfile.uid]) {
                    const cleanReadBy: Record<string, Timestamp> = { ...existingReadBy };
                    cleanReadBy[userProfile.uid] = Timestamp.now();
                    batch.update(msgRef, { readBy: cleanReadBy });
                }
            });
            batch.commit().catch(e => console.log("Mark read error (batch likely too big/frequent):", e));
        }
    }, [messages, userProfile?.uid]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !id || !userProfile || !db || isSending) return;

        setIsSending(true);
        try {
            if (editingMessageId) {
                const msgRef = doc(db, 'messages', editingMessageId);
                await updateDoc(msgRef, {
                    text: messageText.trim(),
                    edited: true,
                    editedAt: Timestamp.now(),
                });
                setEditingMessageId(null);
            } else {
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
                    replyTo: replyTo ? {
                        messageId: replyTo.messageId,
                        senderName: replyTo.senderName,
                        text: replyTo.text,
                    } : null,
                });
            }
            setMessageText('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error sending:', error);
            Alert.alert("Error", "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    // Actions
    const handleLongPress = (id: string) => {
        setIsSelectionMode(true);
        setSelectedMessageIds([id]);
        setActiveMessageForReaction(id);
        setReactionModalVisible(true);
    };

    const handleSelect = (id: string) => {
        if (isSelectionMode) {
            if (selectedMessageIds.includes(id)) {
                const newSelected = selectedMessageIds.filter(mid => mid !== id);
                setSelectedMessageIds(newSelected);
                if (newSelected.length === 0) setIsSelectionMode(false);
            } else {
                setSelectedMessageIds([...selectedMessageIds, id]);
            }
        }
    };

    const handleDelete = async () => {
        if (!db) return;
        Alert.alert('Delete', 'Delete selected messages?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        const batch = writeBatch(db);
                        selectedMessageIds.forEach(mid => {
                            const msgRef = doc(db, 'messages', mid);
                            // Soft delete for consistency
                            batch.update(msgRef, { deleted: true, text: 'This message was deleted' });
                        });
                        await batch.commit();
                        setIsSelectionMode(false);
                        setSelectedMessageIds([]);
                    } catch (e) { Alert.alert("Error", "Could not delete messages."); }
                }
            }
        ]);
    };

    const handleCopy = async () => {
        const texts = messages?.filter(m => selectedMessageIds.includes(m.id) && !m.deleted).map(m => m.text).join('\n');
        if (texts) {
            await Clipboard.setStringAsync(texts);
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
        }
    };

    const handleReplyAction = () => {
        if (selectedMessageIds.length !== 1) return;
        const msg = messages?.find(m => m.id === selectedMessageIds[0]);
        if (msg) setReplyTo({ messageId: msg.id, senderName: msg.senderName, text: msg.text });
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
    };

    const handleEditAction = () => {
        if (selectedMessageIds.length !== 1) return;
        const msg = messages?.find(m => m.id === selectedMessageIds[0]);
        if (!msg) return;
        setEditingMessageId(msg.id);
        setMessageText(msg.text);
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
    };

    const handleReaction = async (emoji: string) => {
        if (!db || !activeMessageForReaction || !userProfile) return;
        // ... (Reaction logic remains same, just condensed)
        try {
            const msgRef = doc(db, 'messages', activeMessageForReaction);
            const msg = messages?.find(m => m.id === activeMessageForReaction);
            if (!msg) return;
            const currentReactions = msg.reactions || {};
            const userId = userProfile.uid;

            let users = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] :
                (typeof currentReactions[emoji] === 'string' ? [currentReactions[emoji] as string] : []);

            if (users.includes(userId)) users = users.filter(u => u !== userId);
            else users.push(userId);

            const newReactions = { ...currentReactions };
            if (users.length > 0) newReactions[emoji] = users;
            else delete newReactions[emoji];

            await updateDoc(msgRef, { reactions: newReactions });
        } catch (e) { console.error(e); }
        setReactionModalVisible(false);
    };

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
        const isOwn = item.senderId === userProfile?.uid;
        const isSelected = selectedMessageIds.includes(item.id);
        const time = item.timestamp ? format(item.timestamp.toDate(), 'HH:mm') : '';

        return (
            <TouchableOpacity
                onLongPress={() => handleLongPress(item.id)}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.9}
                className={`mb-3 flex-row ${isOwn ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-orange-50/50 -mx-4 px-4 py-1' : ''}`}
            >
                {!isOwn && (
                    <View className="mr-2 self-end mb-1">
                        <AvatarWithRing displayName={item.senderName} photoURL="" size="xs" />
                    </View>
                )}

                <View
                    className={`px-3 py-2 rounded-2xl max-w-[75%] shadow-sm border ${item.deleted ? 'bg-gray-100 border-gray-200' :
                        isOwn ? 'bg-apple-orange-500 border-apple-orange-600' :
                            'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                        }`}
                    style={{
                        borderBottomRightRadius: isOwn ? 4 : 16,
                        borderBottomLeftRadius: !isOwn ? 4 : 16,
                    }}
                >
                    {item.replyTo && !item.deleted && (
                        <View className={`mb-2 p-2 rounded-lg border-l-4 ${isOwn ? 'bg-orange-600/30 border-orange-200' : 'bg-gray-100 dark:bg-gray-700 border-orange-500'}`}>
                            <Text className={`text-xs font-bold ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-200'}`}>{item.replyTo.senderName}</Text>
                            <Text className={`text-xs ${isOwn ? 'text-orange-50' : 'text-gray-500 dark:text-gray-400'}`} numberOfLines={1}>{item.replyTo.text}</Text>
                        </View>
                    )}

                    {!isOwn && !item.deleted && (
                        <Text className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">{item.senderName}</Text>
                    )}

                    <Text className={`text-[15px] leading-5 ${item.deleted ? 'italic text-gray-500' : isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.text}
                    </Text>

                    <View className="flex-row justify-end items-center mt-1">
                        {item.edited && !item.deleted && <Text className={`text-[9px] mr-1 ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>edited</Text>}
                        <Text className={`text-[10px] ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>{time}</Text>
                    </View>

                    {/* Reactions */}
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <View className="absolute -bottom-3 right-0 flex-row bg-white dark:bg-gray-700 rounded-full px-1 shadow-sm border border-gray-100 dark:border-gray-600">
                            {Object.keys(item.reactions).slice(0, 3).map(e => <Text key={e} className="text-[10px] m-0.5">{e}</Text>)}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-apple-gray-50 dark:bg-apple-gray-900"
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + 10 : 0} // Fix usage for Stack Header
        >
            <Stack.Screen
                options={{
                    title: isSelectionMode ? `${selectedMessageIds.length} Selected` : chatTitle,
                    headerLeft: () => isSelectionMode ? (
                        <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedMessageIds([]); }}><X size={24} color="#333" /></TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => router.back()} className="mr-3"><ArrowLeft size={24} color="#333" /></TouchableOpacity>
                    ),
                    headerRight: () => isSelectionMode ? (
                        <View className="flex-row gap-4">
                            <TouchableOpacity onPress={handleCopy}><Copy size={20} color="#333" /></TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete}><Trash2 size={20} color="#ef4444" /></TouchableOpacity>
                        </View>
                    ) : (
                        // <AvatarWithRing photoURL={chatIcon} displayName={chatTitle} size="sm" /> // Optional avatar in header
                        <View />
                    ),
                    headerShown: true, // Let Expo Router handle header
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F9FAFB' }, // Match bg-apple-gray-50
                }}
            />

            {/* @ts-ignore */}
            <FlashList
                data={messages}
                renderItem={renderMessageItem}
                estimatedItemSize={100}
                inverted
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
                ListEmptyComponent={
                    <View className="py-10 items-center">
                        <Text className="text-gray-400">No messages yet. Start the conversation!</Text>
                    </View>
                }
            />

            {/* Input */}
            <View className="bg-white dark:bg-apple-gray-800 p-2 border-t border-gray-100 dark:border-gray-700 pb-8">
                {/* Reply/Edit Previews (Same as before, simplified) */}
                {(replyTo || editingMessageId) && (
                    <View className="flex-row justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded mb-2">
                        <Text className="text-xs text-gray-500">{editingMessageId ? 'Editing...' : `Replying to ${replyTo?.senderName}`}</Text>
                        <TouchableOpacity onPress={() => { setReplyTo(null); setEditingMessageId(null); setMessageText(''); }}>
                            <X size={16} color="#999" />
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row items-center">
                    <TextInput
                        className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-3 mr-2 text-base text-gray-900 dark:text-white max-h-24"
                        placeholder="iMessage..."
                        placeholderTextColor="#9ca3af"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                        className={`w-10 h-10 rounded-full items-center justify-center ${messageText.trim() ? 'bg-apple-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        {isSending ? <ActivityIndicator color="white" size="small" /> : <Send size={18} color="white" />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reaction Modal (Simplified) */}
            <Modal transparent visible={reactionModalVisible} animationType="fade" onRequestClose={() => setReactionModalVisible(false)}>
                <TouchableOpacity className="flex-1 bg-black/40 justify-center items-center" onPress={() => setReactionModalVisible(false)}>
                    <View className="bg-white dark:bg-gray-800 rounded-full p-4 flex-row gap-4 shadow-xl">
                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(e => (
                            <TouchableOpacity key={e} onPress={() => handleReaction(e)}><Text className="text-2xl">{e}</Text></TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}
