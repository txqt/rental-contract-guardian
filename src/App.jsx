import { useState } from 'react';
import { Container, Box, Typography, Button, TextField, Paper, CircularProgress, Alert } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { analyzeContract } from './services/gemini';
import Chat from './components/Chat';

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAnalysis('');
    setError('');
    if (selectedFile) {
      try {
        setLoading(true);
        const result = await analyzeContract(selectedFile);
        setAnalysis(result);
      } catch (err) {
        console.error(err);
        setError('Failed to analyze contract. Please check your API key and file format.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Rental Contract Guardian
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading}
          >
            Upload Contract
            <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </Button>
          {file && (
            <Typography variant="body1">Selected: {file.name}</Typography>
          )}
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {analysis && (
            <Box mt={2} width="100%">
              <Typography variant="h6" gutterBottom>Analysis Result</Typography>
              <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
                {analysis}
              </Paper>
            </Box>
          )}
          <Box mt={2} width="100%">
            <TextField
              label="Ask a question about the contract"
              fullWidth
              multiline
              rows={3}
              placeholder="e.g., What is the rent amount?"
            />
          </Box>
          <Chat />
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
