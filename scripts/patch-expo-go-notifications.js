const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'TopicSubscriptionModule.android.js',
);

const replacement = `import { requireOptionalNativeModule } from 'expo-modules-core';

const native = requireOptionalNativeModule('ExpoTopicSubscriptionModule');

const fallback = {
  addListener() {},
  removeListeners() {},
  subscribeToTopicAsync() {
    return Promise.resolve(null);
  },
  unsubscribeFromTopicAsync() {
    return Promise.resolve(null);
  },
};

export default native ?? fallback;
`;

if (!fs.existsSync(target)) {
  process.exit(0);
}

const current = fs.readFileSync(target, 'utf8');
if (current.includes('requireOptionalNativeModule')) {
  process.exit(0);
}

fs.writeFileSync(target, replacement);
