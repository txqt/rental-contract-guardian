import { useState } from 'react';
import { Box, TextField, IconButton, Paper, Typography, List, ListItem, Avatar, CircularProgress, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { chatWithContract } from '../services/gemini';

export default function Chat({ contractContext, language, model }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatWithContract(input, contractContext, language, model);
            const botMsg = { role: 'assistant', content: response };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = { 
                role: 'assistant', 
                content: language === 'vi' 
                    ? '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' 
                    : '❌ Sorry, an error occurred. Please try again.'
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = language === 'vi' ? [
        '💰 Giá thuê là bao nhiêu?',
        '📅 Thời hạn hợp đồng?',
        '⚠️ Điều khoản nào cần lưu ý?',
        '🔑 Quyền và trách nhiệm?'
    ] : [
        '💰 What is the rent?',
        '📅 Contract duration?',
        '⚠️ Important clauses?',
        '🔑 Rights and responsibilities?'
    ];

    return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.default' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {language === 'vi' ? '💬 Hỏi đáp về Hợp đồng' : '💬 Chat about Contract'}
                    </Typography>
                    <Chip label={model} size="small" color="secondary" />
                </Box>
            </Box>

            {/* Suggested Questions */}
            {messages.length === 0 && (
                <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        {language === 'vi' ? 'Câu hỏi gợi ý:' : 'Suggested questions:'}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {suggestedQuestions.map((q, idx) => (
                            <Chip 
                                key={idx}
                                label={q}
                                size="small"
                                variant="outlined"
                                onClick={() => setInput(q.replace(/[💰📅⚠️🔑]/g, '').trim())}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Messages List */}
            <Paper 
                variant="outlined" 
                sx={{ 
                    mb: 2, 
                    maxHeight: 400, 
                    overflow: 'auto',
                    bgcolor: 'white',
                    borderRadius: 2
                }}
            >
                <List sx={{ p: 2 }}>
                    {messages.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                {language === 'vi' 
                                    ? 'Hỏi bất kỳ điều gì về hợp đồng của bạn...' 
                                    : 'Ask anything about your contract...'}
                            </Typography>
                        </Box>
                    ) : (
                        messages.map((msg, idx) => (
                            <ListItem 
                                key={idx} 
                                alignItems="flex-start"
                                sx={{
                                    mb: 2,
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    gap: 1.5
                                }}
                            >
                                <Avatar 
                                    sx={{ 
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                                        width: 36,
                                        height: 36
                                    }}
                                >
                                    {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                                </Avatar>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        maxWidth: '75%',
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        borderTopRightRadius: msg.role === 'user' ? 0 : 16,
                                        borderTopLeftRadius: msg.role === 'assistant' ? 0 : 16,
                                    }}
                                >
                                    <Typography 
                                        variant="caption" 
                                        display="block" 
                                        sx={{ 
                                            mb: 0.5, 
                                            fontWeight: 600,
                                            opacity: 0.8
                                        }}
                                    >
                                        {msg.role === 'user' 
                                            ? (language === 'vi' ? 'Bạn' : 'You') 
                                            : (language === 'vi' ? 'Trợ lý AI' : 'AI Assistant')}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </ListItem>
                        ))
                    )}
                    {loading && (
                        <ListItem sx={{ justifyContent: 'flex-start', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                                <SmartToyIcon />
                            </Avatar>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.100',
                                    borderRadius: 2,
                                    borderTopLeftRadius: 0
                                }}
                            >
                                <CircularProgress size={20} />
                            </Paper>
                        </ListItem>
                    )}
                </List>
            </Paper>

            {/* Input Box */}
            <Box display="flex" alignItems="flex-end" gap={1}>
                <TextField
                    fullWidth
                    placeholder={language === 'vi' 
                        ? 'Nhập câu hỏi của bạn...' 
                        : 'Type your question...'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={loading}
                    multiline
                    maxRows={4}
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />
                <IconButton 
                    color="primary" 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()}
                    sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&.Mui-disabled': { bgcolor: 'grey.300' },
                        width: 48,
                        height: 48
                    }}
                >
                    {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <SendIcon />}
                </IconButton>
            </Box>
        </Paper>
    );
}