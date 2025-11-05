# Travel Backend - Cursor Rules

## Project Overview
This is a NestJS backend application built with TypeScript, TypeORM, and PostgreSQL. The backend provides RESTful APIs for a travel agent application with Google Drive integration.

## Technology Stack
- **Framework**: NestJS 10+
- **ORM**: TypeORM 0.3+
- **Database**: PostgreSQL (via docker-compose)
- **Validation**: class-validator + class-transformer
- **API Prefix**: `/api` (configured in `main.ts`)
- **Package Manager**: pnpm

## Project Structure

```
travel-backend/src/
├── features/              # Feature modules (domain-driven)
│   ├── auth/             # Authentication endpoints
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── user/             # User management
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   ├── entity/
│   │   └── dto/
│   ├── travel/           # Travel itinerary management
│   ├── document/         # Document management
│   └── location/         # Location entities/types
├── common/               # Shared utilities
│   ├── error-codes.ts   # Error code enums and types
│   └── money.ts          # Money utilities
├── config/               # Configuration files
│   └── typeorm.ts        # TypeORM DataSource for migrations
├── database/
│   └── migrations/       # Database migrations
├── utils/                # Utility modules
│   ├── error/           # Error handling
│   │   ├── app-error.ts
│   │   └── all-exceptions.filter.ts
│   └── decorators/       # Custom decorators
├── app.module.ts         # Root module
└── main.ts              # Application entry point
```

## Architecture Patterns

### Module Structure
Each feature follows NestJS module pattern:
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Module**: Registers controllers, services, and dependencies
- **Entity**: TypeORM entity classes
- **DTO**: Data Transfer Objects for validation and serialization

### Example Feature Module
```typescript
// user.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export if used by other modules
})
export class UserModule {}
```

## Coding Standards

### General Principles
- **Always use TypeScript strictly** - avoid `any` types
- **Use dependency injection** - inject dependencies via constructor
- **Follow NestJS conventions** - use decorators appropriately
- **Write self-documenting code** - clear variable and function names
- **Handle errors consistently** - use `AppError` class
- **Log important operations** - use NestJS Logger

### Code Structure
- Keep services focused on single responsibility
- Use DTOs for all request/response validation
- Separate entity models from DTOs
- Use static factory methods for DTOs (e.g., `TravelDto.fromEntity()`)
- Keep controllers thin - delegate logic to services

### Naming Conventions
- **Controllers**: `{Feature}Controller` (e.g., `UserController`)
- **Services**: `{Feature}Service` (e.g., `UserService`)
- **Modules**: `{Feature}Module` (e.g., `UserModule`)
- **Entities**: `{Feature}Entity` (e.g., `UserEntity`)
- **DTOs**: `{Action}{Feature}Dto` (e.g., `CreateTravelDto`)
- **Files**: kebab-case for file names, PascalCase for classes

## TypeORM Patterns

### Entity Definition
```typescript
@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string | null;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
```

### Repository Injection
```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
}
```

### Common Patterns
- Use `@PrimaryGeneratedColumn('uuid')` for IDs
- Use `@CreateDateColumn()` and `@UpdateDateColumn()` for timestamps
- Use `@Index()` for frequently queried columns
- Use `@Column({ nullable: true })` for optional fields
- Use `@Column({ default: value })` for default values
- Use `@Column('jsonb')` for JSON/array fields in PostgreSQL

### Relationships
- **One-to-Many**: `@OneToMany(() => ChildEntity, child => child.parent)`
- **Many-to-One**: `@ManyToOne(() => ParentEntity, parent => parent.children)`
- Use `@JoinColumn()` to specify foreign key column
- Use `cascade: true` for cascading operations
- Use `onDelete: 'CASCADE'` for cascade deletes

## DTO Patterns

### Request DTOs (Input Validation)
```typescript
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateTravelDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  friends: string[];
}
```

### Response DTOs (Output Serialization)
```typescript
export class TravelDto {
  static fromEntity(entity: TravelEntity): TravelDto {
    const dto = new TravelDto();
    dto.id = entity.id;
    dto.name = entity.name;
    // ... map other fields
    return dto;
  }

  id: string;
  name: string;
  // ... other fields
}
```

### Validation Decorators
- `@IsString()` - Validates string type
- `@IsNotEmpty()` - Ensures field is not empty
- `@IsOptional()` - Makes field optional
- `@IsArray()` - Validates array type
- `@IsString({ each: true })` - Validates each array element
- `@IsEmail()` - Validates email format
- `@IsNumber()` - Validates number type
- `@IsBoolean()` - Validates boolean type
- `@IsEnum()` - Validates enum values
- `@IsUUID()` - Validates UUID format

## Error Handling

### AppError Class
```typescript
import { AppError } from 'src/utils/error/app-error';
import { AppErrorCodes, AppErrorType } from 'src/common/error-codes';

throw new AppError({
  message: 'User not found',
  ...AppErrorType[AppErrorCodes.NOT_FOUND],
});
```

### Error Codes
- `INTERNAL_SERVER_ERROR` (500)
- `NOT_FOUND` (404)
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)

### Global Exception Filter
The `AllExceptionsFilter` handles:
- `AppError` instances (custom errors)
- `HttpException` instances (NestJS HTTP errors)
- Database constraint violations (e.g., unique constraint)
- Unknown errors (returns 500)

### Error Response Format
```json
{
  "code": "NOT_FOUND",
  "status": 404,
  "message": "User not found"
}
```

## Controller Patterns

### Basic Controller
```typescript
@Controller('travel')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  create(@Body() createTravelDto: CreateTravelDto) {
    return this.travelService.create(createTravelDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TravelDto> {
    const travel = await this.travelService.findOne(id);
    return TravelDto.fromEntity(travel);
  }
}
```

### Common Decorators
- `@Controller('route')` - Define base route
- `@Get()`, `@Post()`, `@Patch()`, `@Delete()` - HTTP methods
- `@Param('id')` - Extract route parameters
- `@Body()` - Extract request body
- `@Query('key')` - Extract query parameters
- `@UseInterceptors()` - Apply interceptors (e.g., file upload)

### File Upload
```typescript
@Post('upload')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadFiles(
  @UploadedFiles() files: Express.Multer.File[],
  @Body('email') email: string,
) {
  // Handle file upload
}
```

## Service Patterns

### Basic Service
```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = new UserEntity();
      user.email = createUserDto.email;
      return await this.userRepository.save(user);
    } catch (error: any) {
      // Handle errors
      throw new AppError({ ... });
    }
  }
}
```

### Best Practices
- Always use `try-catch` blocks for database operations
- Log errors using `Logger` before throwing
- Use `AppError` for consistent error handling
- Handle database constraint violations (e.g., unique constraint)
- Return entities or DTOs, not raw database results

## Database Migrations

### Migration Structure
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration logic
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
  }
}
```

### Migration Commands
- Generate migration: `pnpm db:migrate:generate`
- Run migrations: `pnpm db:apply`
- Revert migration: `pnpm db:migrate:revert`

### Migration Best Practices
- Never edit existing migrations after they've been applied
- Always test migrations in development first
- Include both `up` and `down` methods
- Use transactions when possible

## API Endpoints

### Authentication
- **POST** `/api/auth/login`
  - Body: `{ email: string }`
  - Creates user if not exists, returns user

### User Management
- **GET** `/api/user/:email` - Get user by email
- **POST** `/api/user` - Create user
- **POST** `/api/user/connect-drive` - Connect Google Drive
- **POST** `/api/user/exchange-drive-token` - Exchange OAuth code
- **POST** `/api/user/disconnect-drive` - Disconnect Google Drive

### Travel Management
- **POST** `/api/travel` - Create travel
  - Body: `CreateTravelDto`
- **GET** `/api/travel/user/:userId` - Get all travels for user
- **GET** `/api/travel/:id` - Get travel by ID (with documents)
- **PATCH** `/api/travel/:id` - Update travel
- **GET** `/api/travel/check-name-unique` - Check if name is unique
- **POST** `/api/travel/create-folder` - Create Google Drive folder

### Document Management
- **POST** `/api/document` - Create document
- **POST** `/api/document/upload` - Upload files (multipart/form-data)
- **GET** `/api/document/travel/:travelId` - Get documents for travel
- **GET** `/api/document/:id` - Get document by ID
- **DELETE** `/api/document/:id` - Delete document

## Google Drive Integration

### OAuth Flow
1. Frontend initiates OAuth flow
2. User authorizes application
3. Frontend sends authorization code to backend
4. Backend exchanges code for access/refresh tokens
5. Backend stores tokens in user entity

### Drive Operations
- `findSiestaiTravelFolder()` - Find existing "Siestai Travel" folder
- `createSiestaiTravelFolder()` - Create "Siestai Travel" folder
- `ensureSiestaiTravelFolderExists()` - Ensure folder exists
- `createTravelFolder()` - Create travel-specific folder
- `refreshAccessToken()` - Refresh expired access token

### Token Management
- Access tokens are stored in `user.drive_access_token`
- Refresh tokens are stored in `user.drive_refresh_token`
- Tokens are refreshed automatically when expired
- Handle 401 errors by refreshing tokens

## Environment Variables

Required environment variables:
- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - PostgreSQL username
- `DATABASE_PASSWORD` - PostgreSQL password
- `DATABASE_NAME` - PostgreSQL database name
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `PORT` - API server port (default: 4000)

## Logging

### Logger Usage
```typescript
private readonly logger = new Logger(UserService.name);

this.logger.debug('Debug message');
this.logger.log('Info message');
this.logger.warn('Warning message');
this.logger.error('Error message', error);
```

### Logging Best Practices
- Use appropriate log levels (debug, log, warn, error)
- Include context in log messages
- Log errors before throwing exceptions
- Log important operations (create, update, delete)

## Testing

### Unit Tests
- Test services independently
- Mock repositories and dependencies
- Test error handling paths
- Test business logic thoroughly

### E2E Tests
- Test complete API flows
- Use test database
- Clean up test data after tests
- Test authentication flows

## Security Best Practices

1. **Input Validation**: Always validate input using DTOs
2. **SQL Injection**: Use TypeORM parameterized queries (default)
3. **Error Messages**: Don't expose sensitive information in errors
4. **Authentication**: Implement proper authentication middleware
5. **Authorization**: Check user permissions before operations
6. **Tokens**: Store refresh tokens securely
7. **Environment Variables**: Never commit secrets to git

## Common Patterns

### Check and Create Pattern
```typescript
async login(loginDto: LoginDto) {
  const foundUser = await this.userService.findByEmail(loginDto.email);
  if (foundUser) return foundUser;
  return this.userService.create({ email: loginDto.email });
}
```

### Unique Constraint Handling
```typescript
try {
  return await this.userRepository.save(user);
} catch (error: any) {
  if (error.code === '23505') { // Unique constraint violation
    // Handle duplicate
    const existing = await this.findByEmail(email);
    if (existing) return existing;
  }
  throw error;
}
```

### Transaction Pattern
```typescript
await this.dataSource.transaction(async (manager) => {
  // Multiple operations
  await manager.save(entity1);
  await manager.save(entity2);
});
```

## Package Management

- **Use `pnpm` as the package manager**
- Always use `pnpm` commands: `pnpm install`, `pnpm add`, etc.
- Lock file is `pnpm-lock.yaml` - commit this file
- Never use `npm` or `yarn` commands directly

## Development Workflow

1. **Create Feature**: Add module, controller, service, entity, DTOs
2. **Create Migration**: Generate migration for schema changes
3. **Test Locally**: Test endpoints with Postman/curl
4. **Write Tests**: Add unit and E2E tests
5. **Commit**: Use descriptive commit messages

## Reminders

- Always use TypeScript strictly
- Use dependency injection for all services
- Validate all inputs using DTOs
- Handle errors consistently with AppError
- Log important operations
- Use migrations for schema changes
- Never edit applied migrations
- Use `pnpm` as package manager
- Follow NestJS conventions
- Keep controllers thin, services fat
- Use static factory methods for DTOs
- Handle database constraint violations
- Test error handling paths

