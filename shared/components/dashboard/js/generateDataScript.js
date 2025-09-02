// ===== API Keys Configuration =====
const API_KEYS = {
    unsplash: [
        'bREBgb3hRH86ZiQalVdyCdX2vW9ljmQxCnyS2QjywFE',
        'a5E5Bl0A4Z6Iy8igufoC5bVw2-6QaTVLBRayZ0dtZVQ',
        'UkhyjQS-mxzVgcoxG6LDI4obolkStBWcKkgy9sVxx4k',
        '3QcWIrvjoHEXeZxExqte39co3HMwOfPv-uG3rln3bYs',
        'iEAbYc3M8I5TzQh88l_FeMaULiu9b-iugUwlQr5LDFk'
    ],
    pixels: [
        '5YudhheXHKBH1I1m698PVS9qREoASepoNhVeIXiqySjupglEUlgso42V',
        'RawSTPfRYvpy5Q7ORR8umHL179MQEX8zPSDDXEUdUjK6g8zhpwamZOIQ',
        'agmcgUt4wQAccYpu4WkSVWlUAXGGI87xEzFiyUqJtspdnyUwSb4A6UZP',
        'RaOYEiXwQNO6inyjb9Unkf5b0iYmw8BvuxPXqS7dmGUKxz9ngIcSToSA',
        'MWP0dCKZPRI4CUDQKk2LC6oVInOKExBYopg9i0r1jENdUGgZmuTybrql'
    ],
    pixabay: [
        '51891391-0a841a69f2b2d2d1db466d4f3',
        '51892010-9fa23efaf899a12fdb351f2dd',
        '51892008-e8473f0734b826e74998cff7e',
        '51892009-23fb0ea92abcba039761362bf',
        '51892046-737c2a82397ffc4fa7b04585c'
    ]
};

// ===== Image Services Configuration =====
const IMAGE_SERVICES = [
    {
        name: 'unsplash',
        getImages: getImagesFromUnsplash,
        keys: API_KEYS.unsplash,
        priority: 1
    },
    {
        name: 'pixels',
        getImages: getImagesFromPixels,
        keys: API_KEYS.pixels,
        priority: 2
    },
    {
        name: 'pixabay',
        getImages: getImagesFromPixabay,
        keys: API_KEYS.pixabay,
        priority: 3
    }
];

// ===== Smart Configuration =====
const CONFIG = {
    USER_TYPES: [
        {
            type: 'superadmin',
            name: 'Super Admin',
            count: 1,
            role: 'superadmin',
            group: 'admins',
            hasProducts: false,
            isProtected: true,
            description: "Cannot be deleted",
            predefined: [
                {
                    name: 'Super Admin',
                    email: 'superadmin@storm.com'
                }
            ]
        },
        {
            type: 'admin',
            name: 'Admins',
            count: 1,
            role: 'admin',
            group: 'admins',
            hasProducts: false,
            description: "Don't buy products",
            predefined: [
                {
                    name: 'Ahmed Ibrahim',
                    email: 'ahmedibrahim@storm.com'
                }
            ]
        },
        {
            type: 'mainSeller',
            name: 'Main Sellers',
            count: 2,
            role: 'seller',
            group: 'sellers',
            hasProducts: true,
            minProducts: 5,
            maxProducts: 10,
            isMainSeller: true,
            description: "With products",
            predefined: [
                {
                    name: 'Abdallah EL-Saied',
                    email: 'abdallahelsaied@storm.com'
                }
            ]
        },
        {
            type: 'additionalSeller',
            name: 'Additional Sellers',
            count: 2,
            role: 'seller',
            group: 'sellers',
            hasProducts: true,
            minProducts: 0,
            maxProducts: 0,
            description: "May have products"
        },
        {
            type: 'customer',
            name: 'Customers',
            count: 5,
            role: 'customer',
            group: 'customers',
            hasProducts: false,
            description: "Regular customers",
            predefined: [
                {
                    name: 'Eslam Ahmed',
                    email: 'eslamahmed@storm.com'
                },
                {
                    name: 'Moaz Yasser',
                    email: 'moazyasser@storm.com'
                }
            ]
        },
        {
            type: 'deleted',
            name: 'Deleted Users',
            count: 5,
            role: 'mixed',
            group: 'deletedUsers',
            hasProducts: false,
            description: "Deleted or inactive users"
        }
    ],
    PRODUCT_SETTINGS: {
        IMAGES: {
            MIN: 1,
            MAX: 2
        }
    },
    IMAGE_SETTINGS: {
        WIDTH: 600,
        HEIGHT: 400,
        ORIENTATION: 'landscape'
    }
};

// English names arrays
const maleNames = [
    "James", "John", "Robert", "Michael", "William",
    "David", "Richard", "Joseph", "Thomas", "Charles"
];

const femaleNames = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth",
    "Barbara", "Susan", "Jessica", "Sarah", "Karen"
];

// Generate random English name
function generateRandomName() {
    const firstName = Math.random() > 0.5
        ? femaleNames[Math.floor(Math.random() * femaleNames.length)]
        : maleNames[Math.floor(Math.random() * maleNames.length)];

    const lastName = maleNames[Math.floor(Math.random() * maleNames.length)];

    return `${firstName} ${lastName}`;
}

// Generate email based on name
function generateEmail(name, type, index) {
    const cleanName = name.replace(/\s+/g, '').toLowerCase();
    return `${cleanName}@example.com`;
}

// ===== Main Data Generation Function =====
async function generateAllData() {
    console.log("⏳ Starting data generation...");
    try {
        // Generate users data first
        const usersData = generateUsersData();
        localStorage.setItem('users', JSON.stringify(usersData.users));
        localStorage.setItem('deletedUsers', JSON.stringify(usersData.deletedUsers));
        console.log("✅ Users data stored in localStorage");
        updateProgress(25);

        // Generate products data based on sellers
        updateProgress(45)
        const productsData = await generateTechProductData(usersData.users);
        localStorage.setItem('oldProducts', JSON.stringify(productsData));
        console.log("✅ Products data stored in localStorage");
        updateProgress(70);

        // Generate orders data based on products and users
        const ordersData = generateOrdersData(productsData, usersData.users);
        localStorage.setItem('oldOrders', JSON.stringify(ordersData));
        console.log("✅ Orders data stored in localStorage");
        updateProgress(80);

        // Update sellers with sales data
        const updatedSellers = updateSellersWithSalesData(usersData.users, ordersData);
        localStorage.setItem('users', JSON.stringify(updatedSellers));
        console.log("✅ Sellers sales data updated");
        updateProgress(100);

        console.log('📦 Final Data:', {
            products: productsData,
            users: updatedSellers,
            deletedUsers: usersData.deletedUsers,
            orders: ordersData
        });

        return true;
    } catch (err) {
        console.error("❌ Error generating data:", err);
        return false;
    }
}

// ===== Data Generation Functions =====
function generateUsersData() {
    console.log("🔹 Generating users data...");

    const statusOptions = ['active', 'inactive', 'suspended'];
    const userRoles = ['customer', 'seller', 'superadmin', 'admin'];

    const users = {
        admins: {},
        sellers: {},
        customers: {}
    };
    const deletedUsers = {};

    let currentId = 1;

    CONFIG.USER_TYPES.forEach(userType => {
        for (let i = 1; i <= userType.count; i++) {
            const userId = currentId++;
            let name, email;

            // Check if there's a predefined user for this type and index
            if (userType.predefined && userType.predefined[i - 1]) {
                name = userType.predefined[i - 1].name;
                email = userType.predefined[i - 1].email;
            } else {
                name = generateRandomName();
                email = generateEmail(name, userType.type, i);
            }

            // استخدام التاريخ الحالي بدلاً من تاريخ ثابت
            const userData = {
                id: userId,
                name: name,
                email: email,
                role: userType.role,
                status: userType.type === 'deleted' ?
                    (Math.random() > 0.3 ? 'deleted' : statusOptions[Math.floor(Math.random() * statusOptions.length)]) :
                    'active',
                createdAt: randomDate(new Date(2020, 0, 1), new Date()).toISOString(), // حتى اليوم
                password: "123456789"
            };

            // Add type-specific properties
            if (userType.isProtected) userData.issuperadmin = true;
            if (userType.isMainSeller) userData.isMainSeller = true;
            if (userType.group === 'sellers' || userType.group === 'customers') {
                userData.address = getRandomAddress();
            }
            if (userType.group === 'sellers') {
                userData.tabs = tabs.seller;
                userData.sales = {
                    totalSales: 0,
                    dailySales: {},
                    weeklySales: {},
                    monthlySales: {},
                    yearlySales: {}
                };
            } else if (userType.group === 'admins' && userType.type === 'admin') {
                userData.tabs = tabs.admin;
            } else if (userType.group === 'admins' && userType.type === 'superadmin') {
                userData.tabs = tabs.superadmin;
            }

            // Handle deleted users
            if (userType.type === 'deleted') {
                userData.role = userRoles[Math.floor(Math.random() * userRoles.length)];
                if (userData.status === 'deleted') {
                    userData.deletedAt = randomDate(new Date(userData.createdAt), new Date()).toISOString(); // حتى اليوم
                }
                deletedUsers[`del_${userId}`] = userData;
            } else {
                users[userType.group][userId] = userData;
            }
        }
    });

    console.log("✅ Finished generating users data.");
    return { users, deletedUsers };
}

async function generateTechProductData(usersData) {
    console.log("🔹 Generating tech product data...");

    const categories = {
        'Computers': ['Laptop', 'Desktop', 'All-in-One', 'Workstation', 'Server'],
        'Computer Components': ['CPU', 'GPU', 'RAM', 'Motherboard', 'SSD', 'HDD', 'Power Supply', 'Cooling System'],
        'Computer Accessories': ['Monitor', 'Keyboard', 'Mouse', 'Webcam', 'Headset', 'External Storage', 'Docking Station'],
        'Phones': ['Smartphone', 'Feature Phone', 'Foldable Phone'],
        'Phone Accessories': ['Case', 'Screen Protector', 'Charger', 'Cable', 'Power Bank', 'Earphones', 'Selfie Stick'],
        'Tablets': ['Android Tablet', 'iPad', 'Windows Tablet', 'E-Reader'],
        'Networking': ['Router', 'Switch', 'Modem', 'Access Point', 'Network Storage', 'VPN Router'],
        'Smart Home': ['Smart Speaker', 'Smart Light', 'Smart Plug', 'Smart Lock', 'Smart Thermostat'],
        'Wearables': ['Smartwatch', 'Fitness Tracker', 'VR Headset', 'AR Glasses'],
        'Gaming': ['Gaming PC', 'Gaming Laptop', 'Gaming Console', 'Gaming Accessories', 'Gaming Chair']
    };

    const brands = {
        'Computers': ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Razer'],
        'Computer Components': ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'Samsung', 'Western Digital', 'Seagate', 'Crucial'],
        'Computer Accessories': ['Logitech', 'Samsung', 'LG', 'Dell', 'HP', 'Anker', 'Belkin'],
        'Phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo'],
        'Phone Accessories': ['Spigen', 'OtterBox', 'Anker', 'Belkin', 'Samsung', 'Apple'],
        'Tablets': ['Apple', 'Samsung', 'Amazon', 'Lenovo', 'Microsoft', 'Huawei'],
        'Networking': ['TP-Link', 'Netgear', 'Asus', 'Linksys', 'Synology', 'Ubiquiti'],
        'Smart Home': ['Google', 'Amazon', 'Philips Hue', 'Nest', 'Ring', 'Eufy'],
        'Wearables': ['Apple', 'Samsung', 'Fitbit', 'Garmin', 'Xiaomi', 'Oculus'],
        'Gaming': ['Sony', 'Microsoft', 'Nintendo', 'Steam', 'Alienware', 'ROG']
    };

    const statusOptions = ['instock', 'lowstock', 'outstock'];
    const techProductsBySeller = {};

    // Process only sellers who should have products
    const sellersWithProducts = CONFIG.USER_TYPES.filter(
        type => type.hasProducts && type.group === 'sellers'
    );

    for (const sellerType of sellersWithProducts) {
        const sellers = Object.values(usersData[sellerType.group])
            .filter(seller => sellerType.isMainSeller ? seller.isMainSeller : !seller.isMainSeller);

        for (const seller of sellers) {
            const sellerKey = `Seller${seller.id}`;
            techProductsBySeller[sellerKey] = {};

            const numProducts = Math.floor(
                Math.random() * (sellerType.maxProducts - sellerType.minProducts + 1)
            ) + sellerType.minProducts;

            if (numProducts === 0) {
                console.log(`🔹 Seller ${seller.id} has no products`);
                continue;
            }

            const startDate = new Date(seller.createdAt);

            for (let productNum = 1; productNum <= numProducts; productNum++) {
                const mainCategories = Object.keys(categories);
                const mainCategory = mainCategories[Math.floor(Math.random() * mainCategories.length)];
                const subCategory = categories[mainCategory][Math.floor(Math.random() * categories[mainCategory].length)];
                const brand = brands[mainCategory][Math.floor(Math.random() * brands[mainCategory].length)];

                const productId = `P_${seller.id}_${productNum}`;
                const name = `${brand} ${subCategory} ${getProductDescriptor()}`;
                const offer = Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 5 : 0;
                const price = getTechProductPrice(mainCategory, subCategory);
                const priceAfterOffer = offer > 0 ? parseFloat((price * (1 - offer / 100)).toFixed(2)) : price;
                const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
                const stock = getStockQuantity(status, mainCategory);
                const rate = parseFloat((Math.random() * 5).toFixed(1));

                // استخدام التاريخ الحالي كحد أقصى
                const addedDate = randomDate(startDate, new Date()); // حتى اليوم
                const totalSales = Math.floor(Math.random() * 100);

                // Generate image URLs instead of base64
                const imgCount = Math.floor(
                    Math.random() * (CONFIG.PRODUCT_SETTINGS.IMAGES.MAX - CONFIG.PRODUCT_SETTINGS.IMAGES.MIN + 1)) + CONFIG.PRODUCT_SETTINGS.IMAGES.MIN;

                const images = await getProductImageUrls(name, mainCategory, subCategory, imgCount);

                techProductsBySeller[sellerKey][productId] = {
                    sellerId: seller.id,
                    id: productId,
                    mainCategory,
                    subCategory,
                    brand,
                    name,
                    price,
                    offer: offer > 0 ? `${offer}%` : '',
                    priceAfterOffer,
                    status,
                    stock,
                    totalSales,
                    rate,
                    createdAt: addedDate.toISOString(),
                    images,
                    visibility: true
                };
            }
        }
    }

    console.log("✅ Finished generating all products.");
    return techProductsBySeller;
}

// Function to get product image URLs from external APIs
async function getProductImageUrls(productName, mainCategory, subCategory, count) {
    const imageUrls = [];
    const searchQueries = [
        `${productName} ${mainCategory} ${subCategory}`,
        `${mainCategory} ${subCategory}`,
        `${subCategory} technology`,
        `${subCategory} product`
    ];

    // Try to get images from all services
    let attempts = 0;
    const maxAttempts = IMAGE_SERVICES.length * 2;

    while (imageUrls.length < count && attempts < maxAttempts) {
        for (const service of IMAGE_SERVICES.sort((a, b) => a.priority - b.priority)) {
            if (imageUrls.length >= count) break;

            try {
                const serviceImages = await service.getImages(searchQueries, count - imageUrls.length, service.keys);
                if (serviceImages && serviceImages.length > 0) {
                    // Ensure first image doesn't contain people
                    if (imageUrls.length === 0 && serviceImages.length > 0) {
                        const firstImage = serviceImages[0];
                        imageUrls.push(firstImage);
                        console.log(`✅ Added first image from ${service.name} for ${productName}`);

                        // Add remaining images
                        if (serviceImages.length > 1) {
                            imageUrls.push(...serviceImages.slice(1));
                        }
                    } else {
                        imageUrls.push(...serviceImages);
                    }
                    console.log(`✅ Got ${serviceImages.length} images from ${service.name}`);
                }
            } catch (error) {
                console.warn(`❌ Failed to get images from ${service.name}:`, error.message);
            }
        }
        attempts++;
    }

    // If we don't have enough images, generate placeholder URLs
    if (imageUrls.length < count) {
        const needed = count - imageUrls.length;
        for (let i = 0; i < needed; i++) {
            const bgColor = getRandomColor();
            const textColor = getContrastColor(bgColor);
            const url = `https://placehold.co/${CONFIG.IMAGE_SETTINGS.WIDTH}x${CONFIG.IMAGE_SETTINGS.HEIGHT}/${bgColor}/${textColor}?text=${encodeURIComponent(productName)}+${i + 1}`;
            imageUrls.push(url);
            console.log(`✅ Generated placeholder image ${i + 1} for ${productName}`);
        }
    }

    // Return the requested number of image URLs
    return imageUrls.slice(0, count);
}

// Function to get images from Unsplash
async function getImagesFromUnsplash(searchQueries, count, keys) {
    const images = [];
    const query = searchQueries[0];
    const key = keys[Math.floor(Math.random() * keys.length)];

    try {
        const orientation = CONFIG.IMAGE_SETTINGS.ORIENTATION === 'all' ? '' : `&orientation=${CONFIG.IMAGE_SETTINGS.ORIENTATION}`;
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}${orientation}&client_id=${key}`);

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            for (const photo of data.results.slice(0, count)) {
                // Use regular size but ensure consistent dimensions
                const imageUrl = `${photo.urls.raw}&w=${CONFIG.IMAGE_SETTINGS.WIDTH}&h=${CONFIG.IMAGE_SETTINGS.HEIGHT}&fit=crop`;
                images.push(imageUrl);
            }
        }
    } catch (error) {
        console.error("Error fetching from Unsplash:", error);
        throw error;
    }

    return images;
}

// Function to get images from Pixels
async function getImagesFromPixels(searchQueries, count, keys) {
    const images = [];
    const query = searchQueries[0];
    const key = keys[Math.floor(Math.random() * keys.length)];

    try {
        const orientation = CONFIG.IMAGE_SETTINGS.ORIENTATION === 'all' ? '' : `&orientation=${CONFIG.IMAGE_SETTINGS.ORIENTATION}`;
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}${orientation}`, {
            headers: {
                'Authorization': key
            }
        });

        if (!response.ok) {
            throw new Error(`Pixels API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            for (const photo of data.photos.slice(0, count)) {
                // Use medium size but ensure consistent dimensions
                const imageUrl = `${photo.src.original}?auto=compress&cs=tinysrgb&w=${CONFIG.IMAGE_SETTINGS.WIDTH}&h=${CONFIG.IMAGE_SETTINGS.HEIGHT}&fit=crop`;
                images.push(imageUrl);
            }
        }
    } catch (error) {
        console.error("Error fetching from Pixels:", error);
        throw error;
    }

    return images;
}

// Function to get images from Pixabay
async function getImagesFromPixabay(searchQueries, count, keys) {
    const images = [];
    const query = searchQueries[0];
    const key = keys[Math.floor(Math.random() * keys.length)];

    try {
        const orientation = CONFIG.IMAGE_SETTINGS.ORIENTATION === 'all' ? 'all' : CONFIG.IMAGE_SETTINGS.ORIENTATION;
        const response = await fetch(`https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=${count}&image_type=photo&orientation=${orientation}`);

        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.hits && data.hits.length > 0) {
            for (const photo of data.hits.slice(0, count)) {
                // Use webformatURL with consistent dimensions
                const imageUrl = `${photo.webformatURL.replace('_640', `_${CONFIG.IMAGE_SETTINGS.WIDTH}`)}`;
                images.push(imageUrl);
            }
        }
    } catch (error) {
        console.error("Error fetching from Pixabay:", error);
        throw error;
    }

    return images;
}

function generateOrdersData(productsData, usersData) {
    console.log("🔹 Generating orders data...");

    const orders = {};
    const paymentMethods = ['Credit Card', 'PayPal', 'Cash on Delivery', 'Bank Transfer'];

    // Get all customer users (only customers can place orders)
    const customers = Object.values(usersData.customers);

    // Calculate date ranges
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Process each seller's products to generate orders
    Object.keys(productsData).forEach(sellerKey => {
        const sellerId = sellerKey.replace('Seller', '');
        const sellerProducts = productsData[sellerKey];
        const seller = usersData.sellers[sellerId];
        const sellerCreatedDate = new Date(seller.createdAt);

        // Generate random orders for each product based on its totalSales
        Object.values(sellerProducts).forEach(product => {
            if (product.totalSales > 0) {
                // Generate random order dates for this product's sales
                for (let i = 0; i < product.totalSales; i++) {
                    const orderId = `O_${sellerId}_${product.id}_${i + 1}`;
                    const customer = customers[Math.floor(Math.random() * customers.length)];

                    // Determine order date (mostly recent dates)
                    let orderDate;
                    if (Math.random() < 0.05) { // 15% of orders in the last week
                        orderDate = randomDate(oneWeekAgo, new Date());
                    } else { // 85% of orders are older
                        orderDate = randomDate(sellerCreatedDate, oneWeekAgo);
                    }

                    // Determine status based on order date
                    let status;
                    if (orderDate >= oneWeekAgo) {
                        // Recent orders (last week): mostly Pending and Processing
                        const rand = Math.random();
                        if (rand < 0.5) status = 'Pending';
                        else if (rand < 0.85) status = 'Processing';
                        else if (rand < 0.95) status = 'Shipped';
                        else status = 'Cancelled';
                    } else {
                        // Older orders: mostly Delivered and Shipped
                        const rand = Math.random();
                        if (rand < 0.7) status = 'Delivered';
                        else if (rand < 0.9) status = 'Shipped';
                        else status = 'Cancelled';
                    }

                    orders[orderId] = {
                        id: orderId,
                        customerId: customer.id,
                        customerName: customer.name,
                        customerEmail: customer.email,
                        sellerId: parseInt(sellerId),
                        products: [{
                            productId: product.id,
                            productName: product.name,
                            quantity: 1,
                            price: product.priceAfterOffer,
                            total: product.priceAfterOffer
                        }],
                        totalPrice: product.priceAfterOffer,
                        status: status,
                        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                        orderDate: orderDate.toISOString(),
                        shippingAddress: customer.address || getRandomAddress()
                    };
                }
            }
        });
    });

    console.log("✅ Finished generating orders data.");
    return orders;
}

function updateSellersWithSalesData(usersData, ordersData) {
    console.log("🔹 Updating sellers with sales data...");

    // Initialize sales data for all sellers
    Object.values(usersData.sellers).forEach(seller => {
        seller.sales = {
            totalSales: 0,
            totalRevenue: 0,
            dailySales: {},
            weeklySales: {},
            monthlySales: {},
            yearlySales: {},
            statusCounts: {
                'Pending': 0,
                'Processing': 0,
                'Shipped': 0,
                'Delivered': 0,
                'Cancelled': 0
            }
        };
    });

    // Process all orders to calculate sales data
    Object.values(ordersData).forEach(order => {
        const seller = usersData.sellers[order.sellerId];
        if (!seller) return;

        const orderDate = new Date(order.orderDate);
        const dayKey = orderDate.toISOString().split('T')[0];
        const weekKey = getYearWeek(orderDate);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = orderDate.getFullYear().toString();

        // Update total sales and revenue (only for completed orders)
        seller.sales.totalSales += 1;
        if (order.status === 'Delivered') {
            seller.sales.totalRevenue += order.totalPrice;
        }

        // Update daily sales
        seller.sales.dailySales[dayKey] = (seller.sales.dailySales[dayKey] || 0) + 1;

        // Update weekly sales
        seller.sales.weeklySales[weekKey] = (seller.sales.weeklySales[weekKey] || 0) + 1;

        // Update monthly sales
        seller.sales.monthlySales[monthKey] = (seller.sales.monthlySales[monthKey] || 0) + 1;

        // Update yearly sales
        seller.sales.yearlySales[yearKey] = (seller.sales.yearlySales[yearKey] || 0) + 1;

        // Update status counts
        if (seller.sales.statusCounts[order.status] !== undefined) {
            seller.sales.statusCounts[order.status] += 1;
        }
    });

    console.log("✅ Finished updating sellers with sales data.");
    return usersData;
}

// ===== Helper Functions =====
function randomDate(start, end) {
    // التأكد من أن start ليس بعد end
    if (start > end) {
        // إذا كان start بعد end، نستخدم end كبداية وstart كنهاية
        [start, end] = [end, start];
    }
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getYearWeek(date) {
    const tempDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - tempDate) / (24 * 60 * 60 * 1000));
    return `${date.getFullYear()}-W${String(Math.ceil((days + tempDate.getDay() + 1) / 7)).padStart(2, '0')}`;
}

function getStockQuantity(status, category) {
    let stock;
    if (status === 'instock') stock = Math.floor(Math.random() * 200) + 50;
    else if (status === 'lowstock') stock = Math.floor(Math.random() * 20) + 5;
    else stock = 0;
    if (['Phone Accessories', 'Computer Accessories'].includes(category)) stock = Math.floor(stock * 1.5);
    else if (['Server', 'Gaming PC'].includes(category)) stock = Math.floor(stock * 0.5);
    return stock;
}

function getTechProductPrice(mainCategory, subCategory) {
    let basePrice = 50;
    if (mainCategory === 'Computers') {
        if (subCategory === 'Laptop') basePrice = 500;
        else if (subCategory === 'Desktop') basePrice = 600;
        else if (subCategory === 'Server') basePrice = 2000;
    }
    else if (mainCategory === 'Computer Components') {
        if (subCategory === 'CPU') basePrice = 200;
        else if (subCategory === 'GPU') basePrice = 400;
    }
    else if (mainCategory === 'Phones') {
        if (subCategory === 'Smartphone') basePrice = 600;
        else if (subCategory === 'Foldable Phone') basePrice = 1200;
    }
    else if (mainCategory === 'Tablets') basePrice = 300;
    else if (mainCategory === 'Gaming') {
        if (subCategory.includes('Console')) basePrice = 500;
        else if (subCategory.includes('PC')) basePrice = 1000;
    }
    const variation = Math.random() * 0.5 + 0.75;
    return parseFloat((basePrice * variation).toFixed(2));
}

function getProductDescriptor() {
    const descriptors = ['Pro', 'Max', 'Plus', 'Ultra', 'Elite', 'Premium', 'Advanced',
        'Standard', 'Basic', 'Lite', 'Edition', 'X', 'Z', '2023', '2024'];
    return descriptors[Math.floor(Math.random() * descriptors.length)];
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getContrastColor(hex) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '000000' : 'FFFFFF';
}

function getRandomAddress() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const streets = ['Main St', 'First St', 'Second St', 'Third St', 'Fourth St',
        'Fifth Ave', 'Park Ave', 'Maple St', 'Oak St', 'Pine St'];

    return {
        city: cities[Math.floor(Math.random() * cities.length)],
        street: `${Math.floor(Math.random() * 100) + 1} ${streets[Math.floor(Math.random() * streets.length)]}`,
        zipCode: Math.floor(Math.random() * 90000) + 10000
    };
}

// ===== Tabs Configuration =====
let tabs = {
    superadmin: [
        { icon: "fa-regular fa-chart-bar", pageName: "Dashboard", fileName: "dashboard" },
        { icon: "fa-solid fa-users", pageName: "customers", fileName: "customers" },
        { icon: "fa-solid fa-store", pageName: "Sellers", fileName: "sellers" },
        { icon: "fa-solid fa-box", pageName: "Products", fileName: "products" },
        { icon: "fa-solid fa-bell-concierge", pageName: "orders", fileName: "orders" },
        { icon: "fa-solid fa-user-tie", pageName: "admins", fileName: "admin-settings" }
    ],
    admin: [
        { icon: "fa-regular fa-chart-bar", pageName: "Dashboard", fileName: "dashboard" },
        { icon: "fa-solid fa-users", pageName: "customers", fileName: "customers" },
        { icon: "fa-solid fa-store", pageName: "Sellers", fileName: "sellers" },
        { icon: "fa-solid fa-box", pageName: "Products", fileName: "products" },
        { icon: "fa-solid fa-bell-concierge", pageName: "orders", fileName: "orders" },
    ],
    seller: [
        { icon: "fa-regular fa-chart-bar", pageName: "Dashboard", fileName: "dashboard" },
        { icon: "fa-solid fa-box", pageName: "Products", fileName: "products" },
        { icon: "fa-solid fa-cart-shopping", pageName: "Orders", fileName: "orders" },
        { icon: "fa-solid fa-gear", pageName: "Settings", fileName: "settings" }
    ]
};

// Function to update progress
function updateProgress(percent) {
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = percent + "%";
}

// Function to start loading
async function startLoading() {
    const loaderImg = document.getElementById("loaderImg");

    const success = await generateAllData();

    if (success) {
        loaderImg.style.animation = "scaleAndFade 2s forwards";

        setTimeout(() => {
            window.location.href = "/index.html";
        }, 2000);
    } else {
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
}

// Initialize page on load
window.addEventListener('load', startLoading);