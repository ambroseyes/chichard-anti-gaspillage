process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://chichard:chichard@127.0.0.1:5432/chichard_test';
process.env.JWT_SECRET ??= 'test_only_jwt_secret_0123456789abcdefghijklmnop';
process.env.PICKUP_TOKEN_SECRET ??= 'test_only_pickup_secret_0123456789abcdefghijkl';
process.env.ENABLE_SCHEDULER = 'false';
process.env.PAYMENT_PROVIDER = 'manual';
process.env.LLM_PROVIDER = 'none';
process.env.SMTP_HOST = '';
