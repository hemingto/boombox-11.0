# Boombox 11.0 - Mobile Storage & Logistics Platform

**Version**: 11.0  
**Framework**: Next.js 15.3.5 with App Router  
**Database**: PostgreSQL with Prisma ORM  
**Deployment**: Vercel

## 🚀 Project Overview

Boombox 11.0 is a comprehensive mobile storage and logistics platform that connects customers with storage solutions and moving services. This is a clean refactor from boombox-10.0, implementing modern Next.js architecture with improved code organization, performance, and maintainability.

### Key Features

- **Mobile Storage Services**: On-demand storage unit delivery and pickup
- **Packing Supply Delivery**: Onfleet-powered packing supply logistics
- **Moving Partner Network**: Driver and mover management with availability tracking
- **Payment Processing**: Stripe Connect integration for multi-party payments
- **Real-time Tracking**: Onfleet integration for delivery tracking
- **Admin Dashboard**: Comprehensive management interface
- **Customer Portal**: Self-service booking and account management

---

## 🏗️ Architecture Overview

### Technology Stack

| Category           | Technology         | Version | Purpose                          |
| ------------------ | ------------------ | ------- | -------------------------------- |
| **Frontend**       | Next.js            | 15.3.5  | React framework with App Router  |
| **Backend**        | Next.js API Routes | 15.3.5  | Serverless API endpoints         |
| **Database**       | PostgreSQL         | Latest  | Primary database (Neon)          |
| **ORM**            | Prisma             | 6.11.1  | Database client and migrations   |
| **Authentication** | NextAuth.js        | 4.24.11 | Authentication system            |
| **Payments**       | Stripe Connect     | 18.3.0  | Multi-party payment processing   |
| **Logistics**      | Onfleet API        | 1.3.8   | Delivery management and tracking |
| **Messaging**      | Twilio + SendGrid  | Latest  | SMS and email notifications      |
| **Styling**        | Tailwind CSS       | 3.4.9   | Utility-first CSS framework      |
| **Deployment**     | Vercel             | Latest  | Serverless deployment platform   |

### Project Structure

```
boombox-11.0/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (public)/           # Public marketing pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── api/                # API routes organized by domain
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   ├── components/              # React components
│   │   ├── ui/                 # Design system components
│   │   ├── forms/              # Form components
│   │   ├── layouts/            # Layout components
│   │   ├── features/           # Business domain components
│   │   └── icons/              # Icon components
│   ├── lib/                    # Utilities & configurations
│   │   ├── auth/               # NextAuth configuration
│   │   ├── database/           # Prisma client & utilities
│   │   ├── integrations/       # External API clients
│   │   ├── messaging/          # Centralized messaging system
│   │   ├── utils/              # Utility functions
│   │   └── validations/        # Zod validation schemas
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript definitions
│   ├── styles/                 # Design system & CSS
│   └── constants/              # Application constants
├── prisma/                     # Database schema & migrations
├── docs/                       # Project documentation
├── tests/                      # Test files
└── tools/                      # Development tools
```

---

## 🔧 Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (recommended package manager)
- **PostgreSQL**: 14.x or higher
- **Git**: Latest version

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/boombox_11"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Onfleet
ONFLEET_API_KEY="your-onfleet-api-key"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# OpenAI (Optional)
OPENAI_API_KEY="your-openai-api-key"
```

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd boombox-11.0
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up the database**

   ```bash
   # Generate Prisma client
   pnpm prisma generate

   # Run database migrations
   pnpm prisma migrate dev

   # Seed the database (optional)
   pnpm prisma db seed
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Available Scripts

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `pnpm dev`                | Start development server     |
| `pnpm build`              | Build production application |
| `pnpm start`              | Start production server      |
| `pnpm lint`               | Run ESLint                   |
| `pnpm format`             | Format code with Prettier    |
| `pnpm format:check`       | Check code formatting        |
| `pnpm test`               | Run Jest tests               |
| `pnpm test:watch`         | Run tests in watch mode      |
| `pnpm prisma studio`      | Open Prisma Studio           |
| `pnpm prisma migrate dev` | Run database migrations      |
| `pnpm prisma generate`    | Generate Prisma client       |

---

## 🔌 Key Integrations

### Stripe Connect (Payment Processing)

- **Purpose**: Multi-party payment processing for customers, drivers, and moving partners
- **Implementation**: Stripe Connect accounts for moving partners and drivers
- **Features**: Payment intents, subscriptions, payouts, webhooks
- **Configuration**: See `src/lib/integrations/stripePaymentService.ts`

### Onfleet API (Logistics Management)

- **Purpose**: Delivery management and real-time tracking
- **Version**: API v2.7
- **Features**: Task creation, worker management, webhook notifications
- **Configuration**: See `src/lib/integrations/onfleetApiClient.ts`
- **Webhooks**: Handled at `/api/onfleet/webhook`

### NextAuth.js (Authentication)

- **Purpose**: User authentication and session management
- **Providers**: Email/password, OAuth providers
- **Configuration**: See `src/lib/auth/nextAuthConfig.ts`
- **Database**: Sessions stored in PostgreSQL

### Prisma ORM (Database)

- **Purpose**: Type-safe database access and migrations
- **Database**: PostgreSQL (Neon for production)
- **Features**: Auto-generated types, migrations, seeding
- **Configuration**: See `prisma/schema.prisma`

### Twilio (SMS Messaging)

- **Purpose**: SMS notifications and verification
- **Features**: Appointment reminders, status updates, verification codes
- **Configuration**: See `src/lib/messaging/twilioService.ts`

### SendGrid (Email Messaging)

- **Purpose**: Transactional email delivery
- **Features**: Appointment confirmations, invoices, notifications
- **Configuration**: See `src/lib/messaging/sendgridService.ts`

### Cloudinary (Image Storage)

- **Purpose**: Image upload and optimization
- **Features**: Storage unit photos, damage reports, user uploads
- **Configuration**: See Next.js config for image domains

---

## 🎯 Business Domains

### 1. Storage Services

- **Mobile Storage Units**: On-demand delivery and pickup
- **Storage Management**: Unit tracking, cleaning, damage reports
- **Access Requests**: Customer access to stored items

### 2. Packing Supplies

- **Order Management**: Packing supply delivery orders
- **Onfleet Integration**: Route optimization and tracking
- **Feedback System**: Customer feedback on deliveries

### 3. Moving Partners

- **Driver Management**: Independent drivers and vehicles
- **Moving Companies**: Third-party moving partner integration
- **Availability Tracking**: Real-time availability management

### 4. Appointments & Scheduling

- **Booking System**: Customer appointment scheduling
- **Time Slot Management**: Availability and booking management
- **Cancellation Handling**: Automated cancellation processing

### 5. Payment Processing

- **Customer Payments**: Service charges and subscriptions
- **Partner Payouts**: Automated driver and mover payments
- **Invoice Management**: Automated invoice generation

### 6. Admin Operations

- **Dashboard**: Real-time operational overview
- **Task Management**: Admin task assignment and tracking
- **Reporting**: Business analytics and reports

---

## 🚦 API Routes Organization

### Authentication Domain (`/api/auth/`)

- User login, signup, password reset
- Email verification, session management

### Payment Domain (`/api/payments/`)

- Stripe customer creation, payment intents
- Webhook handling, payout processing

### Orders Domain (`/api/orders/`)

- **Appointments**: Booking, editing, cancellation
- **Packing Supplies**: Order creation, tracking, feedback

### Onfleet Domain (`/api/onfleet/`)

- Task creation and management
- Worker management, webhook processing

### Drivers Domain (`/api/drivers/`)

- Driver registration, vehicle management
- Availability tracking, assignment logic

### Moving Partners Domain (`/api/moving-partners/`)

- Partner registration, approval process
- Job assignment, availability management

### Customers Domain (`/api/customers/`)

- Profile management, appointment history
- Storage unit access, billing information

### Admin Domain (`/api/admin/`)

- Dashboard statistics, user management
- Task assignment, reporting endpoints

---

## 🧪 Testing

### Test Structure

```
tests/
├── __tests__/
│   ├── components/          # Component tests
│   ├── api/                 # API route tests
│   ├── utils/               # Utility function tests
│   └── integration/         # Integration tests
├── __mocks__/               # Mock files
└── fixtures/                # Test data
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

---

## 📚 Documentation

### Project Documentation

- **REFACTOR_PRD.md**: Complete refactoring plan and progress
- **docs/SETUP_005_FILE_MAPPING_AUDIT.md**: File migration audit
- **docs/FILE_MIGRATION_TRACKER.md**: Migration progress tracker
- **docs/workflows/**: Business workflow documentation

### External API Documentation

- **docs/external-api-docs/onfleet-api-context.md**: Onfleet integration guide
- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Onfleet Documentation**: [https://docs.onfleet.com](https://docs.onfleet.com)

---

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**

   ```bash
   npx vercel --prod
   ```

2. **Environment Variables**
   Set all required environment variables in Vercel dashboard

3. **Database Setup**
   - Use Neon PostgreSQL for production
   - Run migrations: `pnpm prisma migrate deploy`

4. **Domain Configuration**
   - Set up custom domain in Vercel
   - Update NEXTAUTH_URL environment variable

### Build Process

```bash
# Build for production
pnpm build

# Start production server locally
pnpm start
```

---

## 🔒 Security Considerations

### Authentication

- NextAuth.js with secure session management
- CSRF protection enabled
- Rate limiting on API endpoints

### Data Protection

- Environment variables for sensitive data
- Encrypted database connections
- Secure webhook signature validation

### API Security

- Input validation with Zod schemas
- Authorization checks on protected routes
- Sanitized database queries with Prisma

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check database connection
   pnpm prisma studio

   # Reset database
   pnpm prisma migrate reset
   ```

2. **Build Errors**

   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Reinstall dependencies
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Environment Variables**
   - Ensure all required variables are set
   - Check `.env.local` file exists
   - Verify variable names match exactly

### Development Tools

- **Prisma Studio**: Database management UI
- **Next.js DevTools**: React component debugging
- **Vercel Analytics**: Performance monitoring

---

## 📞 Support & Contributing

### Getting Help

- Check existing documentation in `docs/` directory
- Review API route documentation in code comments
- Consult external API documentation for integrations

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Document API changes
- Follow semantic commit messages

### Code Quality

- ESLint configuration enforced
- Prettier formatting required
- Pre-commit hooks for quality checks
- TypeScript strict mode enabled

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: 2025-01-28  
**Next.js Version**: 15.3.5  
**Node.js Version**: 18.x+  
**Database**: PostgreSQL with Prisma ORM
