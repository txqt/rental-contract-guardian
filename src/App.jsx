import { useState } from 'react';
import { Container, Box, Typography, Button, Paper, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, InputLabel, Chip, Stack } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DescriptionIcon from '@mui/icons-material/Description';
import { analyzeContract } from './services/gemini';
import Chat from './components/Chat';

const GEMINI_MODELS = [
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Thông minh nhất)', tier: 'premium' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Cân bằng)', tier: 'recommended' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Nhanh nhất)', tier: 'fast' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Tư duy cao cấp)', tier: 'premium' },
];

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null); // Now stores JSON object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('vi');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [contractContext, setContractContext] = useState('');

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    // Clear input value so same file can be selected again if needed
    e.target.value = '';

    setFile(selectedFile);
    setAnalysis('');
    setError('');
    setContractContext('');

    if (selectedFile) {
      try {
        setLoading(true);
        const result = await analyzeContract(selectedFile, language, model);
        setAnalysis(result);

        // Create optimized context for chat
        const contextStr = language === 'vi'
          ? `Điểm rủi ro: ${result.risk_score}/100.
               Tóm tắt: ${result.plain_english_summary.join('; ')}.
               Điều khoản nguy hiểm: ${result.dangerous_clauses.map(c => `${c.clause} (${c.original_text})`).join('; ')}.
               Điều khoản thiếu: ${result.missing_clauses.map(c => c.clause).join('; ')}.`
          : `Risk Score: ${result.risk_score}/100.
               Summary: ${result.plain_english_summary.join('; ')}.
               Dangerous Clauses: ${result.dangerous_clauses.map(c => `${c.clause} (${c.original_text})`).join('; ')}.
               Missing Clauses: ${result.missing_clauses.map(c => c.clause).join('; ')}.`;

        setContractContext(contextStr);
      } catch (err) {
        console.error(err);
        setError(language === 'vi'
          ? 'Không thể phân tích hợp đồng. Vui lòng kiểm tra file hoặc thử lại.'
          : 'Failed to analyze contract. Please check file or try again.');
        // Reset file if analysis failed so user can try again
        setFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const getModelTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'primary';
      case 'recommended': return 'success';
      case 'fast': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{
      mt: 4, mb: 4, display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Header */}
          <Box textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              {language === 'vi' ? '🏠 Trợ Lý Hợp Đồng Thuê Nhà' : '🏠 Rental Contract Guardian'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {language === 'vi'
                ? 'Phân tích hợp đồng thông minh với AI'
                : 'Smart contract analysis powered by AI'}
            </Typography>
            <Chip
              label={language === 'vi' ? '🇻🇳 Đang hỗ trợ tốt nhất cho Hợp đồng Việt Nam' : '🇻🇳 Optimized for Vietnamese Contracts'}
              color="success"
              variant="outlined"
              size="small"
              sx={{ mt: 1, fontWeight: 500 }}
            />
          </Box>

          {/* Settings Section */}
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Stack spacing={3}>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                {/* Language Toggle */}
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                    {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={language}
                      onChange={handleLanguageChange}
                    >
                      <MenuItem value="vi">🇻🇳 Tiếng Việt</MenuItem>
                      <MenuItem value="en">🇬🇧 English</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Model Selection */}
                <Box sx={{ minWidth: 300, flex: 1 }}>
                  <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                    {language === 'vi' ? 'Mô hình AI' : 'AI Model'}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={loading}
                    >
                      {GEMINI_MODELS.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{m.label}</Typography>
                            <Chip
                              label={m.tier === 'recommended' ? '⭐ Đề xuất' : m.tier === 'premium' ? '💎 Pro' : '⚡ Fast'}
                              size="small"
                              color={getModelTierColor(m.tier)}
                              sx={{ height: 20 }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Stack>
          </Paper>

          {/* Upload Section */}
          <Box textAlign="center">
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={loading}
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {language === 'vi' ? '📄 Tải Hợp Đồng Lên' : '📄 Upload Contract'}
              <input
                hidden
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Box mt={2} display="flex" justifyContent="center">
                <Chip
                  icon={<DescriptionIcon />}
                  label={file.name}
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    setFile(null);
                    setAnalysis('');
                    setContractContext('');
                  }}
                />
              </Box>
            )}

            {loading && (
              <Box mt={2}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {language === 'vi' ? 'Đang phân tích hợp đồng...' : 'Analyzing contract...'}
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
                {error}
              </Alert>
            )}
          </Box>


          {/* Analysis Result */}
          {analysis && (
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Risk Score Card */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', borderColor: analysis.risk_score > 70 ? 'error.main' : analysis.risk_score > 30 ? 'warning.main' : 'success.main', borderWidth: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {language === 'vi' ? '🛡️ Điểm Rủi Ro Hợp Đồng' : '🛡️ Contract Risk Score'}
                    </Typography>
                    <Typography variant="h3" fontWeight={700} color={analysis.risk_score > 70 ? 'error.main' : analysis.risk_score > 30 ? 'warning.main' : 'success.main'}>
                      {analysis.risk_score}/100
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {analysis.risk_score <= 30
                        ? (language === 'vi' ? '✅ Hợp đồng khá an toàn.' : '✅ Contract looks safe.')
                        : analysis.risk_score <= 70
                          ? (language === 'vi' ? '⚠️ Cần xem xét kỹ một số điều khoản.' : '⚠️ Review some terms carefully.')
                          : (language === 'vi' ? '🚨 Rủi ro cao! Cẩn thận.' : '🚨 High Risk! Be careful.')}
                    </Typography>
                    {/* Progress bar could go here */}
                  </Box>
                </Box>
              </Paper>

              {/* Plain English Summary */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Summary
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {analysis.plain_english_summary.map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <Typography variant="body1">{item}</Typography>
                    </li>
                  ))}
                </Box>
              </Paper>

              {/* Key Details Grid */}
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
                {Object.entries(analysis.summary).map(([key, value]) => (
                  <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Missing Clauses */}
              {analysis.missing_clauses && analysis.missing_clauses.length > 0 && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {language === 'vi' ? 'Thiếu các điều khoản quan trọng:' : 'Missing Important Clauses:'}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {analysis.missing_clauses.map((item, index) => (
                      <li key={index}>
                        <Typography variant="body2">
                          <strong>{item.clause}</strong>: {item.importance}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* Dangerous Clauses */}
              {analysis.dangerous_clauses && analysis.dangerous_clauses.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {language === 'vi' ? '🚨 Điều Khoản Nguy Hiểm' : '🚨 Dangerous Clauses'}
                  </Typography>
                  <Stack spacing={2}>
                    {analysis.dangerous_clauses.map((item, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'error.light', borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          {item.clause}
                        </Typography>
                        {item.original_text && (
                          <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 1, borderLeft: '2px solid #ccc', fontStyle: 'italic' }}>
                            <Typography variant="body2" fontFamily="monospace">
                              "{item.original_text}"
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body2" color="error" gutterBottom>
                          ⚠️ {item.reason}
                        </Typography>
                        {item.suggestion && (
                          <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            💡 {item.suggestion}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Legal Comparison */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {language === 'vi' ? '⚖️ Đối chiếu pháp luật' : '⚖️ Legal Comparison'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {analysis.legal_comparison}
                </Typography>

                {analysis.legal_references && analysis.legal_references.length > 0 && (
                  <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                    {analysis.legal_references.map((ref, idx) => (
                      <Chip
                        key={idx}
                        label={ref.text}
                        component="a"
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* Chat Section */}
          {contractContext && (
            <Chat
              contractContext={contractContext}
              language={language}
              model={model}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default App;