import { Camera, CameraView } from 'expo-camera';
import { Stack } from 'expo-router';
import {
    AppState,
    View,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    Button,
} from 'react-native';
import { Overlay } from './Overlay';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface QR {
    B: number;
    secret: 'фичабилет';
}

const URL =
    'https://script.google.com/macros/s/AKfycbxZey8V_Zku_za87Zh73WLtGH0dD4A10XQc86bIABWdt0pYAiNQVabiWMddowHCke2y/exec';

export default function Home() {
    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);

    const [openModalAboutTicket, setOpenModalAboutTicket] = useState(false);
    const [error, setError] = useState('');
    const [responseFromGoogle, setResponseFromGoogle] = useState<{
        title: string;
        status?: string;
        isScanned: string;
    }>({ title: 'загрузочка', status: '', isScanned: 'false' });

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                qrLock.current = false;
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <SafeAreaView style={StyleSheet.absoluteFillObject}>
            <Stack.Screen
                options={{
                    title: 'Overview',
                    headerShown: false,
                }}
            />
            {Platform.OS === 'android' ? <StatusBar hidden /> : null}
            {openModalAboutTicket ? (
                <View
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                    }}>
                    {error ? (
                        <Text style={{ fontSize: 45, color: 'red' }}>{error}</Text>
                    ) : (
                        <>
                            <Text
                                style={{
                                    fontSize: 50,
                                    color: JSON.parse(responseFromGoogle.isScanned)
                                        ? 'red'
                                        : 'green',
                                }}>
                                {responseFromGoogle.title}
                            </Text>
                            <Text style={{ fontSize: 45 }}>{responseFromGoogle.status}</Text>
                        </>
                    )}

                    <Button
                        disabled={(() => {
                            if (error) {
                                return false;
                            }

                            if (responseFromGoogle.title === 'загрузочка') {
                                return true;
                            }

                            return false;
                        })()}
                        title='Дальше'
                        onPress={() => {
                            if (error) {
                                setError('');
                            }
                            setResponseFromGoogle({ title: 'загрузочка', isScanned: 'false' });
                            setOpenModalAboutTicket(false);
                            qrLock.current = false;
                        }}
                    />
                </View>
            ) : (
                <>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing='back'
                        onBarcodeScanned={async ({ data }) => {
                            if (data && !qrLock.current) {
                                qrLock.current = true;
                                const qrDataObj: QR = JSON.parse(data);
                                if (qrDataObj.secret === 'фичабилет') {
                                    setOpenModalAboutTicket(true);
                                    await axios
                                        .post(URL, null, {
                                            params: {
                                                B: qrDataObj.B,
                                            },
                                        })
                                        .then(r => {
                                            setResponseFromGoogle(
                                                JSON.parse(JSON.stringify(r.data)),
                                            );
                                        });
                                } else {
                                    setError('странный код');
                                    setOpenModalAboutTicket(true);
                                }
                            } else {
                                setError('Кривой QR');
                                setOpenModalAboutTicket(true);
                            }
                        }}
                    />
                    <Overlay />
                </>
            )}
        </SafeAreaView>
    );
}
