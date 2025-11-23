import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../lib/utils';
import type { Role } from '../lib/types';

interface AvatarWithRingProps {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
    role?: Role | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onPress?: () => void;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
};

const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-3xl',
};

const ringPadding = {
    sm: 2,
    md: 3,
    lg: 3,
    xl: 4,
};

export default function AvatarWithRing({
    photoURL,
    displayName,
    email,
    role,
    size = 'md',
    className,
    onPress
}: AvatarWithRingProps) {
    const isVolunteer = role === 'Volunteer';
    const isSemiCore = role === 'Semi-core';
    const isHead = role === 'Head';
    const isCore = role === 'Core';

    const sizeClass = sizeClasses[size];
    const textSizeClass = textSizeClasses[size];
    const padding = ringPadding[size];

    const AvatarContent = () => (
        <View className={cn("rounded-full bg-orange-100 dark:bg-orange-900 items-center justify-center overflow-hidden", sizeClass)}>
            {photoURL ? (
                <Image
                    source={{ uri: photoURL }}
                    className="w-full h-full"
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <Text className={cn("font-bold text-orange-600 dark:text-orange-400", textSizeClass)}>
                    {displayName?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || 'U'}
                </Text>
            )}
        </View>
    );

    const RingWrapper = ({ children }: { children: React.ReactNode }) => {
        if (isVolunteer) {
            return (
                <LinearGradient
                    colors={['#a855f7', '#ec4899', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding, borderRadius: 9999 }}
                >
                    <View className="bg-white dark:bg-gray-800 rounded-full p-[2px]">
                        {children}
                    </View>
                </LinearGradient>
            );
        }

        let borderColor = 'border-gray-300 dark:border-gray-600';
        let borderStyle = 'border-solid';

        if (isCore) borderColor = 'border-red-500';
        if (isSemiCore) {
            borderColor = 'border-blue-500';
            borderStyle = 'border-dashed';
        }
        if (isHead) {
            borderColor = 'border-green-500';
            borderStyle = 'border-dotted';
        }

        return (
            <View className={cn(
                "rounded-full bg-white dark:bg-gray-800",
                `border-[${padding}px]`,
                borderColor,
                borderStyle
            )} style={{ padding: 2, borderWidth: padding }}>
                {children}
            </View>
        );
    };

    const Content = (
        <RingWrapper>
            <AvatarContent />
        </RingWrapper>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} className={className}>
                {Content}
            </TouchableOpacity>
        );
    }

    return <View className={className}>{Content}</View>;
}
