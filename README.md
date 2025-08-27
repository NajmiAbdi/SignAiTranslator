# AI-Based Real-Time Sign Language Translator

A comprehensive system for real-time sign language translation with mobile app and admin dashboard.

## 🚀 Features

### Mobile App (React Native + Expo)
- Real-time sign language recognition via camera
- Text-to-speech conversion
- Speech-to-sign animation
- Real-time chat with translation
- User authentication and profiles
- Cross-platform (iOS & Android)

### Admin Dashboard (React + TypeScript + Tailwind)
- User management (CRUD operations)
- Dataset management and AI model training
- Analytics and usage statistics
- System logs and monitoring
- Role-based access control

## 🛠️ Tech Stack

- **Mobile**: React Native, Expo SDK 53, TypeScript
- **Web**: React.js, TypeScript, Tailwind CSS, Vite
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth with JWT
- **AI Integration**: Modular service architecture
- **Styling**: Tailwind CSS (web), StyleSheet (mobile)

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project

## 🔧 Setup Instructions

### 1. Environment Configuration

Create `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_AI_API_KEY=your_ai_service_api_key_here
```

Create `admin-dashboard/.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_AI_API_KEY=your_ai_service_api_key_here
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/20250820142514_pink_sound.sql`
3. Update your environment variables with the actual Supabase URL and keys

### 3. Installation

Install mobile app dependencies:
```bash
npm install
```

Install admin dashboard dependencies:
```bash
cd admin-dashboard
npm install
cd ..
```

### 4. Running the Applications

Start the mobile app:
```bash
npm run dev
```

Start the admin dashboard:
```bash
cd admin-dashboard
npm run dev
```

## 🏗️ Project Structure

```
Sign-Language-Translator/
├── app/                          # Mobile app screens (Expo Router)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Camera/Translation screen
│   │   ├── chat.tsx             # Real-time chat
│   │   ├── profile.tsx          # User profile
│   │   └── settings.tsx         # App settings
│   └── _layout.tsx              # Root layout
├── admin-dashboard/              # Web admin dashboard
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Dashboard pages
│   │   └── services/            # API services
├── lib/                         # Shared libraries
├── services/                    # AI and external services
├── types/                       # TypeScript definitions
└── supabase/                    # Database migrations
```

## 🔐 Security Features

- Row-Level Security (RLS) policies
- Role-based access control (user/admin)
- JWT authentication
- Data encryption in transit
- Environment variable protection

## 🎯 Key Components

### Mobile App Features
- **Camera Translation**: Real-time sign recognition with confidence scoring
- **Chat System**: Multi-format messaging with real-time sync
- **Audio Integration**: Text-to-speech and speech recognition
- **User Management**: Profile, preferences, and statistics

### Admin Dashboard Features
- **User Management**: View, edit, and manage user accounts
- **Dataset Management**: Upload and train AI models
- **Analytics**: Usage metrics and system performance
- **System Monitoring**: Logs, errors, and health checks

## 🚀 Deployment

### Mobile App
```bash
# Build for production
npm run build:web

# For mobile deployment, use EAS Build
npx eas build --platform all
```

### Admin Dashboard
```bash
cd admin-dashboard
npm run build
# Deploy the dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure all `.env` files are properly configured
2. **Supabase Connection**: Verify your Supabase project URL and keys
3. **Camera Permissions**: Grant camera access for sign recognition
4. **Network Issues**: Check internet connection for real-time features

### Error Resolution

- **ENOENT errors**: Check file paths and ensure all required files exist
- **Hermes errors**: Verify all imports/exports are correct
- **Supabase errors**: Check RLS policies and authentication status

For more help, check the project documentation or create an issue.