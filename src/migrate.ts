import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { Role } from './modules/role/schemas/role.schema';
import RolesData from '../assets/roles.json';
import UsersData from '../assets/user.json';
import { User } from '@modules/user/schema/user.schema';

/**
 * Migration to seed roles and users in the database
 */
async function migrate() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Inject Role & User models
    const roleModel = app.get<Model<Role>>('RoleModel');
    const userModel = app.get<Model<User>>('UserModel');

    console.log('Connected to MongoDB');

    // Ensure indexes exist
    await roleModel.syncIndexes();
    await userModel.syncIndexes();

    console.log('Indexes created successfully');

    // Insert default roles if they don't exist
    const existingRoles = await roleModel.countDocuments();
    if (existingRoles === 0) {
        await roleModel.insertMany(RolesData);
        console.log('Default roles inserted');
    }

    // Insert default admin user if not exists
    const adminRole = await roleModel.findOne({ role: 'super_admin' });
    if (adminRole) {
        const existingAdmin = await userModel.findOne({ email: UsersData.email });
        if (!existingAdmin) {
            await userModel.create({ ...UsersData, role: adminRole._id });
            console.log('Default admin user created');
        }
    }

    console.log('Migration completed successfully');

    await app.close();
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
});
