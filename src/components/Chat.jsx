import { useState } from 'react';
import { Box, TextField, IconButton, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

// Simple placeholder chat component. In a full implementation this would call the Gemini API.
export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        // Placeholder response – echo the question.
        const botMsg = { role: 'assistant', content: `You asked: "${input}". (Gemini integration pending)` };
        setMessages((prev) => [...prev, userMsg, botMsg]);
        setInput('');
    };

    return (
        <Paper elevation={3} sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6" gutterBottom>Chat with Contract Guardian</Typography>
            <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {messages.map((msg, idx) => (
                    <ListItem key={idx} alignItems="flex-start">
                        <ListItemText
                            primary={msg.role === 'user' ? 'You' : 'Assistant'}
                            secondary={msg.content}
                        />
                    </ListItem>
                ))}
            </List>
            <Box display="flex" mt={2}>
                <TextField
                    fullWidth
                    placeholder="Ask a question about the contract..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <IconButton color="primary" onClick={handleSend} sx={{ ml: 1 }}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
}
