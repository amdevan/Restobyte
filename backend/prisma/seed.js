import prisma from '../src/db/prisma.js';
async function run() {
    console.log('Seeding database...');
    const catMain = await prisma.category.upsert({
        where: { name: 'Main Course' },
        update: {},
        create: { name: 'Main Course', description: 'Primary dishes', imageUrl: null },
    });
    const catDrinks = await prisma.category.upsert({
        where: { name: 'Drinks' },
        update: {},
        create: { name: 'Drinks', description: 'Beverages', imageUrl: null },
    });
    const burger = await prisma.menuItem.create({
        data: {
            name: 'Classic Burger',
            description: 'Beef patty with lettuce, tomato, and cheese',
            categoryId: catMain.id,
            price: 9.99,
            imageUrl: null,
            isVegetarian: false,
            variations: {
                create: [
                    { name: 'Single', price: 9.99 },
                    { name: 'Double', price: 12.99 },
                ],
            },
        },
        include: { variations: true, category: true },
    });
    const cola = await prisma.menuItem.create({
        data: {
            name: 'Cola',
            description: 'Chilled soft drink',
            categoryId: catDrinks.id,
            price: 2.5,
            imageUrl: null,
            isVegetarian: true,
        },
        include: { category: true },
    });
    const customer = await prisma.customer.create({
        data: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St' },
    });
    const order = await prisma.order.create({
        data: {
            customerId: customer.id,
            status: 'PENDING',
            items: {
                create: [
                    { menuItemId: burger.id, quantity: 1, unitPrice: 9.99 },
                    { menuItemId: cola.id, quantity: 2, unitPrice: 2.5 },
                ],
            },
        },
        include: { items: true },
    });
    const total = order.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    await prisma.order.update({ where: { id: order.id }, data: { total } });
    console.log('Seed complete.');
}
run()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map