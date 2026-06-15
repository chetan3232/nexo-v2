export interface IntentData {
  appType: string;
  targetUsers: string;
  platform: string;
  coreFeatures: string[];
}

export const analyzeIntent = (prompt: string): IntentData => {
  const lower = prompt.toLowerCase();
  
  let appType = 'Web Application';
  if (lower.includes('landing') || lower.includes('marketing')) appType = 'Landing Page';
  else if (lower.includes('dashboard') || lower.includes('admin')) appType = 'Analytics Dashboard';
  else if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('store')) appType = 'E-commerce Platform';
  else if (lower.includes('chat') || lower.includes('social') || lower.includes('messenger')) appType = 'Social Chat App';

  let targetUsers = 'General Public';
  if (lower.includes('developer') || lower.includes('programmer')) targetUsers = 'Developers / Tech Savvy';
  else if (lower.includes('business') || lower.includes('merchant')) targetUsers = 'SMB Owners';
  else if (lower.includes('child') || lower.includes('kid')) targetUsers = 'Children / Students';

  let platform = 'Cross-platform Web';
  if (lower.includes('mobile') || lower.includes('phone')) platform = 'Responsive Mobile View';
  else if (lower.includes('desktop') || lower.includes('monitor')) platform = 'Desktop First View';

  // Feature extraction
  const coreFeatures: string[] = ['Interactive States', 'Modern Styling Layout'];
  if (lower.includes('auth') || lower.includes('login') || lower.includes('signup')) coreFeatures.push('Authentication Screens');
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('stat')) coreFeatures.push('Interactive Charts');
  if (lower.includes('payment') || lower.includes('checkout') || lower.includes('stripe')) coreFeatures.push('Stripe Payment Frame');
  if (lower.includes('search') || lower.includes('filter')) coreFeatures.push('Dynamic Filter Sorting');

  return {
    appType,
    targetUsers,
    platform,
    coreFeatures,
  };
};
