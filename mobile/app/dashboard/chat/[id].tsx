import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../firebase/useAuth';
import { useCollection } from '../../../firebase/useCollection';
import { collection, query, where, orderBy, addDoc, Timestamp, doc, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Trash2, Edit2, Copy, Smile, Reply, X } from 'lucide-react-native';
import { format } from 'date-fns';
import AvatarWithRing from '../../../components/AvatarWithRing';
import * as Clipboard from 'expo-clipboard';

interface ChatMessage {
    id: string;
    teamId: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Timestamp;
    deleted?: boolean;
    edited?: boolean;
    reactions?: Record<string, string[]>; // userId -> [emojis] (Web uses array, Mobile used string. Updating to match Web)
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
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Selection Mode State
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Reaction Popup State
    const [reactionModalVisible, setReactionModalVisible] = useState(false);
    const [activeMessageForReaction, setActiveMessageForReaction] = useState<string | null>(null);

    // Reply & Edit State
    const [replyTo, setReplyTo] = useState<{ messageId: string; senderName: string; text: string } | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

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

    // Mark messages as read
    useEffect(() => {
        if (!db || !id || !userProfile?.uid || !messages) return;

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
                const cleanReadBy: Record<string, Timestamp> = { ...existingReadBy };
                cleanReadBy[userProfile.uid] = Timestamp.now();
                batch.update(msgRef, { readBy: cleanReadBy });
            });
            batch.commit().catch(console.error);
        }
    }, [messages, userProfile?.uid]);


    const handleSendMessage = async () => {
        if (!messageText.trim() || !id || !userProfile || !db || isSending) return;

        setIsSending(true);
        try {
            if (editingMessageId) {
                // Update existing message
                const msgRef = doc(db, 'messages', editingMessageId);
                await updateDoc(msgRef, {
                    text: messageText.trim(),
                    edited: true,
                    editedAt: Timestamp.now(),
                });
                setEditingMessageId(null);
                setMessageText('');
            } else {
                // Send new message
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
                setMessageText('');
                setReplyTo(null);
            }
        } catch (error) {
            console.error('Error sending/editing message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleLongPress = (messageId: string) => {
        setIsSelectionMode(true);
        setSelectedMessageIds([messageId]);
        setActiveMessageForReaction(messageId);
        setReactionModalVisible(true);
    };

    const handleSelect = (messageId: string) => {
        if (isSelectionMode) {
            if (selectedMessageIds.includes(messageId)) {
                const newSelected = selectedMessageIds.filter(id => id !== messageId);
                setSelectedMessageIds(newSelected);
                if (newSelected.length === 0) {
                    setIsSelectionMode(false);
                }
            } else {
                setSelectedMessageIds([...selectedMessageIds, messageId]);
            }
        }
    };

    const handleDelete = async () => {
        if (!db) return;
        Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        for (const msgId of selectedMessageIds) {
                            const msgRef = doc(db, 'messages', msgId);
                            await updateDoc(msgRef, { deleted: true, text: 'This message was deleted' });
                        }
                        setIsSelectionMode(false);
                        setSelectedMessageIds([]);
                    } catch (error) {
                        console.error("Error deleting", error);
                    }
                }
            }
        ]);
    };

    const handleCopy = async () => {
        const selectedTexts = messages
            ?.filter(m => selectedMessageIds.includes(m.id) && !m.deleted)
            .map(m => m.text)
            .join('\n');

        if (selectedTexts) {
            await Clipboard.setStringAsync(selectedTexts);
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
        }
    };

    const handleReplyAction = () => {
        if (selectedMessageIds.length !== 1) return;
        const msg = messages?.find(m => m.id === selectedMessageIds[0]);
        if (msg) {
            setReplyTo({
                messageId: msg.id,
                senderName: msg.senderName,
                text: msg.text,
            });
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
        }
    };

    const handleEditAction = () => {
        if (selectedMessageIds.length !== 1) return;
        const msg = messages?.find(m => m.id === selectedMessageIds[0]);
        if (msg) {
            setEditingMessageId(msg.id);
            setMessageText(msg.text);
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
        }
    };

    const handleReaction = async (emoji: string) => {
        if (!db || !activeMessageForReaction || !userProfile) return;
        try {
            const msgRef = doc(db, 'messages', activeMessageForReaction);
            const msg = messages?.find(m => m.id === activeMessageForReaction);
            const currentReactions = msg?.reactions || {};
            const userId = userProfile.uid;

            // Web app uses array of userIds for each emoji
            // Check if currentReactions[emoji] is array (Web) or string (Legacy Mobile)
            let usersForEmoji: string[] = [];
            const val = currentReactions[emoji];
            if (Array.isArray(val)) {
                usersForEmoji = val;
            } else if (typeof val === 'string') {
                usersForEmoji = [val]; // Convert legacy string to array
            }

            if (usersForEmoji.includes(userId)) {
                // Remove reaction
                usersForEmoji = usersForEmoji.filter(id => id !== userId);
            } else {
                // Add reaction
                usersForEmoji.push(userId);
            }

            const newReactions = { ...currentReactions };
            if (usersForEmoji.length > 0) {
                newReactions[emoji] = usersForEmoji;
            } else {
                delete newReactions[emoji];
            }

            await updateDoc(msgRef, { reactions: newReactions });
            setReactionModalVisible(false);
        } catch (error) {
            console.error("Error reacting", error);
        }
    };

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
        const isOwn = item.senderId === userProfile?.uid;
        const time = item.timestamp ? format(item.timestamp.toDate(), 'HH:mm') : '';
        const isSelected = selectedMessageIds.includes(item.id);

        // Flatten reactions for display
        const displayedReactions: string[] = [];
        if (item.reactions) {
            Object.entries(item.reactions).forEach(([emoji, users]) => {
                if (Array.isArray(users) && users.length > 0) displayedReactions.push(emoji);
                else if (typeof users === 'string') displayedReactions.push(emoji); // Legacy support
            });
        }

        return (
            <TouchableOpacity
                onLongPress={() => handleLongPress(item.id)}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.8}
                className={`mb-2 flex-row ${isOwn ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-orange-50/50 -mx-4 px-4 py-1' : ''}`}
            >
                <View
                    className={`px-3 py-2 rounded-lg max-w-[80%] shadow-sm ${item.deleted ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200' :
                        isOwn ? 'bg-orange-500 dark:bg-orange-600' : 'bg-white dark:bg-gray-800'
                        }`}
                    style={{
                        borderTopRightRadius: isOwn ? 0 : 12,
                        borderTopLeftRadius: isOwn ? 12 : 0,
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                    }}
                >
                    {/* Reply Context */}
                    {item.replyTo && !item.deleted && (
                        <View className={`mb-2 p-2 rounded border-l-4 ${isOwn ? 'bg-orange-600 border-orange-300' : 'bg-gray-100 border-orange-500'}`}>
                            <Text className={`text-xs font-bold ${isOwn ? 'text-orange-100' : 'text-orange-600'}`}>{item.replyTo.senderName}</Text>
                            <Text className={`text-xs ${isOwn ? 'text-orange-50' : 'text-gray-500'}`} numberOfLines={1}>{item.replyTo.text}</Text>
                        </View>
                    )}

                    {!isOwn && !item.deleted && (
                        <Text className="text-xs font-bold text-orange-600 mb-1">{item.senderName}</Text>
                    )}
                    <Text className={`text-base ${item.deleted ? 'italic text-gray-500' : isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.text}
                    </Text>
                    <View className="flex-row justify-end items-center mt-1 space-x-1">
                        {item.edited && !item.deleted && <Text className="text-[10px] text-gray-300 mr-1">edited</Text>}
                        <Text className={`text-[10px] ${isOwn ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {time}
                        </Text>
                    </View>

                    {/* Reactions Display */}
                    {displayedReactions.length > 0 && (
                        <View className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100 dark:border-gray-600 flex-row">
                            {displayedReactions.slice(0, 3).map((emoji, idx) => (
                                <Text key={idx} className="text-xs">{emoji}</Text>
                            ))}
                            {displayedReactions.length > 3 && (
                                <Text className="text-[10px] text-gray-500 ml-1">+{displayedReactions.length - 3}</Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
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
            {isSelectionMode ? (
                <View className="bg-white dark:bg-gray-800 pt-12 pb-3 px-4 flex-row items-center shadow-md z-10 justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedMessageIds([]); }}>
                            <ArrowLeft size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-4">{selectedMessageIds.length}</Text>
                    </View>
                    <View className="flex-row space-x-6">
                        <TouchableOpacity onPress={handleReplyAction}><Reply size={22} color="#374151" /></TouchableOpacity>
                        <TouchableOpacity onPress={handleCopy}><Copy size={22} color="#374151" /></TouchableOpacity>
                        {/* Only show delete/edit if all selected are own messages and not deleted */}
                        {selectedMessageIds.every(id => {
                            const m = messages?.find(msg => msg.id === id);
                            return m?.senderId === userProfile?.uid && !m.deleted;
                        }) && (
                                <>
                                    {/* Edit only if 1 message selected and < 24h */}
                                    {selectedMessageIds.length === 1 && (() => {
                                        const msg = messages?.find(m => m.id === selectedMessageIds[0]);
                                        const now = Timestamp.now();
                                        const diff = now.seconds - (msg?.timestamp.seconds || 0);
                                        return diff < 86400; // 24 hours
                                    })() && (
                                            <TouchableOpacity onPress={handleEditAction}><Edit2 size={22} color="#374151" /></TouchableOpacity>
                                        )}
                                    <TouchableOpacity onPress={handleDelete}><Trash2 size={22} color="#ef4444" /></TouchableOpacity>
                                </>
                            )}
                    </View>
                </View>
            ) : (
                <View className="bg-white dark:bg-gray-800 pt-12 pb-3 px-2 flex-row items-center shadow-md z-10">
                    <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mr-2">
                        <ArrowLeft size={24} color="#374151" />
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
                        <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>{chatTitle}</Text>
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                            {id === 'common' ? 'tap for group info' : 'tap for team info'}
                        </Text>
                    </View>
                    <View className="flex-row space-x-4 mr-2">
                        <TouchableOpacity className="ml-4"><MoreVertical size={24} color="#374151" /></TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Chat List */}
            <View className="flex-1 bg-[#ECE5DD] dark:bg-gray-900">
                {messagesLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#f97316" />
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
            <View className="p-2 bg-transparent pb-6">
                {/* Reply Preview */}
                {replyTo && (
                    <View className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg border-l-4 border-orange-500 flex-row justify-between items-center mx-2">
                        <View className="flex-1">
                            <Text className="text-xs font-bold text-orange-600">Replying to {replyTo.senderName}</Text>
                            <Text className="text-xs text-gray-600 dark:text-gray-300" numberOfLines={1}>{replyTo.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyTo(null)}>
                            <X size={16} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                )}
                {/* Edit Preview */}
                {editingMessageId && (
                    <View className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-t-lg border-l-4 border-blue-500 flex-row justify-between items-center mx-2">
                        <View className="flex-1">
                            <Text className="text-xs font-bold text-blue-600">Editing Message</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setEditingMessageId(null); setMessageText(''); }}>
                            <X size={16} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row items-end">
                    <View className="flex-1 bg-white dark:bg-gray-800 rounded-full flex-row items-center px-4 py-2 mr-2 shadow-sm min-h-[48px]">
                        <TextInput
                            className="flex-1 text-base text-gray-900 dark:text-white max-h-24"
                            placeholder={editingMessageId ? "Edit message..." : "Message"}
                            placeholderTextColor="#9ca3af"
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                        className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${!messageText.trim() || isSending ? 'bg-gray-400' : 'bg-orange-500'
                            }`}
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reaction Modal */}
            <Modal
                transparent={true}
                visible={reactionModalVisible}
                onRequestClose={() => setReactionModalVisible(false)}
                animationType="fade"
            >
                <TouchableOpacity
                    className="flex-1 bg-black/20 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setReactionModalVisible(false)}
                >
                    <View className="bg-white dark:bg-gray-800 rounded-full p-2 flex-row space-x-4 shadow-lg">
                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} className="p-2">
                                <Text className="text-2xl">{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}
