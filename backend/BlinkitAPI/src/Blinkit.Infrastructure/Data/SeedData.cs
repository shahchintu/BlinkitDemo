using Blinkit.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Infrastructure.Data;

public static class SeedData
{
    private static string Img(string id) => $"https://picsum.photos/seed/{id}/200/200";

    private static string CatImg(string slug) => $"https://picsum.photos/seed/cat-{slug}/200/200";

    public static async Task SeedAsync(
        BlinkitDbContext db,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // ── Roles ─────────────────────────────────────────────────────────────
        foreach (var role in new[] { "Admin", "User" })
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        // ── Admin user ────────────────────────────────────────────────────────
        if (await userManager.FindByEmailAsync("admin@blinkit.com") is null)
        {
            var admin = new AppUser
            {
                UserName = "admin@blinkit.com",
                Email = "admin@blinkit.com",
                FullName = "Blinkit Admin",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, "Admin");
        }

        // ── Test user ─────────────────────────────────────────────────────────
        if (await userManager.FindByEmailAsync("test@blinkit.com") is null)
        {
            var test = new AppUser
            {
                UserName = "test@blinkit.com",
                Email = "test@blinkit.com",
                FullName = "Test User",
                Phone = "9876543210",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(test, "Test@123");
            await userManager.AddToRoleAsync(test, "User");
        }

        if (await db.Categories.IgnoreQueryFilters().AnyAsync()) return;

        // ── 15 Categories ─────────────────────────────────────────────────────
        var cats = new Dictionary<string, Category>
        {
            ["fruits-vegetables"]  = Cat("Fruits & Vegetables", "fruits-vegetables",  CatImg("fruits-vegetables"),  1),
            ["dairy-eggs"]         = Cat("Dairy & Eggs",        "dairy-eggs",          CatImg("dairy-eggs"),          2),
            ["snacks"]             = Cat("Snacks & Munchies",   "snacks",              CatImg("snacks"),              3),
            ["beverages"]          = Cat("Cold Drinks & Juices","beverages",           CatImg("beverages"),           4),
            ["bakery"]             = Cat("Bread & Bakery",      "bakery",              CatImg("bakery"),              5),
            ["meat-fish"]          = Cat("Meat, Fish & Eggs",   "meat-fish",           CatImg("meat-fish"),           6),
            ["personal-care"]      = Cat("Personal Care",       "personal-care",       CatImg("personal-care"),       7),
            ["household"]          = Cat("Household Essentials","household",           CatImg("household"),           8),
            ["baby-care"]          = Cat("Baby Care",           "baby-care",           CatImg("baby-care"),           9),
            ["pet-care"]           = Cat("Pet Care",            "pet-care",            CatImg("pet-care"),           10),
            ["pharma"]             = Cat("Pharma & Wellness",   "pharma",              CatImg("pharma"),             11),
            ["beauty"]             = Cat("Beauty & Grooming",   "beauty",              CatImg("beauty"),             12),
            ["frozen-foods"]       = Cat("Frozen Food",         "frozen-foods",        CatImg("frozen-foods"),       13),
            ["breakfast-cereals"]  = Cat("Breakfast & Cereals", "breakfast-cereals",   CatImg("breakfast-cereals"),  14),
            ["electronics"]        = Cat("Electronics",         "electronics",         CatImg("electronics"),        15),
            ["masala-oil"]         = Cat("Masala, Oil & More",  "masala-oil",          CatImg("masala-oil"),         16),
        };
        await db.Categories.AddRangeAsync(cats.Values);

        // ── Coupons ───────────────────────────────────────────────────────────
        var coupons = new List<Coupon>
        {
            new() { Id = Guid.NewGuid(), Code = "WELCOME50", DiscountType = DiscountType.Percent, DiscountValue = 50, MinOrderAmount = 200, MaxDiscountAmount = 100, ValidFor = CouponValidFor.NewUsers, IsActive = true },
            new() { Id = Guid.NewGuid(), Code = "BLINKIT10", DiscountType = DiscountType.Percent, DiscountValue = 10, MinOrderAmount = 199, MaxDiscountAmount = 100, ValidFor = CouponValidFor.All,      IsActive = true },
            new() { Id = Guid.NewGuid(), Code = "BANK5",     DiscountType = DiscountType.Percent, DiscountValue = 5,  MinOrderAmount = 300, MaxDiscountAmount = 50,  ValidFor = CouponValidFor.All,      IsActive = true },
            new() { Id = Guid.NewGuid(), Code = "FREESHIP",  DiscountType = DiscountType.Flat,    DiscountValue = 0,  MinOrderAmount = 0,   MaxDiscountAmount = null, ValidFor = CouponValidFor.All,     IsActive = true },
        };
        await db.Coupons.AddRangeAsync(coupons);

        // ── Delivery Slots ────────────────────────────────────────────────────
        var slots = new List<DeliverySlot>
        {
            new() { Id = Guid.NewGuid(), Label = "Morning",  StartTime = new TimeOnly(9,  0), EndTime = new TimeOnly(12, 0), MaxOrders = 100, IsActive = true },
            new() { Id = Guid.NewGuid(), Label = "Evening",  StartTime = new TimeOnly(17, 0), EndTime = new TimeOnly(21, 0), MaxOrders = 100, IsActive = true },
        };
        await db.DeliverySlots.AddRangeAsync(slots);

        // ── Products ──────────────────────────────────────────────────────────
        var products = new List<Product>();

        // ── 1. FRUITS & VEGETABLES ────────────────────────────────────────────
        var fv = cats["fruits-vegetables"];

        products.AddRange(new[]
        {
            P(fv, "Banana", "banana",
              "Fresh Cavendish bananas, naturally ripened and sweet.",
              Vs(V("6 pcs", 29, null, 80),  V("12 pcs", 55, 58, 50)),
              As(A("Type","Cavendish"), A("Origin","India"), A("Net Weight","~800g")),
              Tags("banana","fruit","fresh fruit","yellow fruit"),
              Imgs("413","414","415")),

            P(fv, "Apple Shimla", "apple-shimla",
              "Crisp and sweet Shimla apples from Himachal Pradesh.",
              Vs(V("500g", 79, 89, 60),  V("1 kg", 149, 169, 40)),
              As(A("Variety","Shimla"), A("Origin","Himachal Pradesh"), A("Storage","Refrigerate")),
              Tags("apple","fruit","fresh fruit","shimla apple"),
              Imgs("416","417","418")),

            P(fv, "Tomato", "tomato",
              "Farm-fresh tomatoes ideal for curries, salads and gravies.",
              Vs(V("250g", 15, null, 100), V("500g", 27, 30, 80), V("1 kg", 49, 55, 60)),
              As(A("Type","Hybrid"), A("Origin","Maharashtra"), A("Net Weight","250g")),
              Tags("tomato","vegetable","fresh vegetable","sabzi"),
              Imgs("419","420","421")),

            P(fv, "Onion", "onion",
              "Fresh red onions essential for Indian cooking.",
              Vs(V("500g", 22, null, 150), V("1 kg", 39, 45, 100), V("2 kg", 72, 80, 60)),
              As(A("Variety","Red Onion"), A("Origin","Maharashtra"), A("Net Weight","500g")),
              Tags("onion","vegetable","pyaaz","fresh vegetable"),
              Imgs("422","423","424")),

            P(fv, "Potato", "potato",
              "Premium quality potatoes perfect for all dishes.",
              Vs(V("500g", 22, null, 150), V("1 kg", 39, 45, 100), V("2 kg", 72, 80, 60)),
              As(A("Variety","Desi"), A("Origin","Uttar Pradesh"), A("Net Weight","500g")),
              Tags("potato","vegetable","aloo","sabzi"),
              Imgs("425","426","427")),

            P(fv, "Carrot", "carrot",
              "Crunchy fresh carrots rich in Vitamin A and beta-carotene.",
              Vs(V("250g", 19, null, 100), V("500g", 35, 38, 80)),
              As(A("Type","Orange Carrot"), A("Origin","Punjab"), A("Storage","Refrigerate")),
              Tags("carrot","vegetable","gajar","fresh vegetable"),
              Imgs("428","429","430")),

            P(fv, "Baby Spinach", "baby-spinach",
              "Tender baby spinach leaves, washed and ready to cook.",
              Vs(V("250g", 29, null, 80), V("500g", 49, 55, 50)),
              As(A("Type","Baby Spinach"), A("Origin","Gujarat"), A("Storage","Refrigerate below 4°C")),
              Tags("spinach","palak","vegetable","leafy vegetable","green vegetable"),
              Imgs("431","432","433")),

            P(fv, "Fresh Coriander", "fresh-coriander",
              "Fragrant fresh coriander leaves for garnishing and chutneys.",
              Vs(V("100g", 15, null, 100), V("250g", 29, 33, 80)),
              As(A("Type","Fresh Coriander"), A("Origin","Rajasthan"), A("Storage","Refrigerate")),
              Tags("coriander","dhaniya","herb","green vegetable"),
              Imgs("434","435","436")),

            P(fv, "Lemon", "lemon",
              "Fresh juicy lemons high in Vitamin C.",
              Vs(V("4 pcs", 19, null, 100), V("8 pcs", 35, 38, 80)),
              As(A("Type","Kagzi Lemon"), A("Origin","Andhra Pradesh")),
              Tags("lemon","nimbu","fruit","citrus","sour"),
              Imgs("437","438","439")),

            P(fv, "Cucumber", "cucumber",
              "Crisp and refreshing cucumbers for salads and raita.",
              Vs(V("250g", 19, null, 100), V("500g", 35, 38, 80)),
              As(A("Type","Desi"), A("Origin","Maharashtra"), A("Net Weight","250g")),
              Tags("cucumber","kheera","vegetable","salad","fresh vegetable"),
              Imgs("440","441","442")),

            P(fv, "Capsicum Green", "capsicum-green",
              "Fresh green capsicums with a mild, crispy flavour.",
              Vs(V("250g", 29, null, 80), V("500g", 55, 59, 60)),
              As(A("Type","Green Capsicum"), A("Origin","Maharashtra")),
              Tags("capsicum","shimla mirch","vegetable","bell pepper"),
              Imgs("443","444","445")),

            P(fv, "Broccoli", "broccoli",
              "Fresh imported broccoli rich in fibre and vitamins.",
              Vs(V("250g", 49, null, 60), V("500g", 89, 99, 40)),
              As(A("Type","Broccoli"), A("Origin","Himachal Pradesh"), A("Storage","Refrigerate")),
              Tags("broccoli","vegetable","healthy vegetable","diet food"),
              Imgs("446","447","448")),

            P(fv, "Strawberry", "strawberry",
              "Sweet and tangy strawberries, freshly harvested.",
              Vs(V("200g", 79, 89, 40), V("400g", 149, 169, 30)),
              As(A("Variety","Camarosa"), A("Origin","Mahabaleshwar"), A("Storage","Refrigerate")),
              Tags("strawberry","fruit","berry","fresh fruit"),
              Imgs("460","461","462")),

            P(fv, "Pomegranate", "pomegranate",
              "Juicy red pomegranates loaded with antioxidants.",
              Vs(V("500g", 89, null, 50), V("1 kg", 169, 189, 30)),
              As(A("Variety","Bhagwa"), A("Origin","Maharashtra"), A("Storage","Room temperature")),
              Tags("pomegranate","anar","fruit","fresh fruit"),
              Imgs("463","464","465")),

            P(fv, "Watermelon", "watermelon",
              "Refreshingly sweet and hydrating watermelon.",
              Vs(V("1 piece (~3kg)", 89, 99, 30)),
              As(A("Type","Seedless"), A("Origin","Andhra Pradesh")),
              Tags("watermelon","tarbooj","fruit","summer fruit"),
              Imgs("466","467","468")),

            P(fv, "Green Grapes", "green-grapes",
              "Crisp and sweet seedless green grapes.",
              Vs(V("500g", 89, 99, 40), V("1 kg", 169, 189, 30)),
              As(A("Variety","Thompson Seedless"), A("Origin","Nashik")),
              Tags("grapes","angur","fruit","seedless grapes"),
              Imgs("469","470","471")),

            P(fv, "Alphonso Mango", "alphonso-mango",
              "King of mangoes — Ratnagiri Alphonso with rich creamy flavour.",
              Vs(V("500g", 149, null, 30), V("1 kg", 289, 319, 20)),
              As(A("Variety","Alphonso (Hapus)"), A("Origin","Ratnagiri"), A("Season","March–June")),
              Tags("mango","aam","alphonso","hapus","fruit","summer fruit"),
              Imgs("472","473","474")),

            P(fv, "Papaya", "papaya",
              "Sweet yellow papaya rich in papain enzyme and vitamins.",
              Vs(V("500g", 39, null, 60), V("1 kg", 69, 79, 40)),
              As(A("Type","Red Lady"), A("Origin","Maharashtra"), A("Net Weight","500g")),
              Tags("papaya","papita","fruit","fresh fruit","tropical fruit"),
              Imgs("475","476","477")),

            P(fv, "Cauliflower", "cauliflower",
              "Fresh white cauliflower head for curries and stir fry.",
              Vs(V("500g", 29, null, 80), V("1 kg", 49, 55, 60)),
              As(A("Type","Desi"), A("Origin","Haryana"), A("Net Weight","500g")),
              Tags("cauliflower","gobhi","phool gobhi","vegetable","sabzi"),
              Imgs("478","479","480")),

            P(fv, "Cabbage", "cabbage",
              "Fresh green cabbage for salads, soups and stir-fry.",
              Vs(V("500g", 19, null, 100), V("1 kg", 35, 38, 80)),
              As(A("Type","Green Cabbage"), A("Origin","Gujarat")),
              Tags("cabbage","patta gobhi","vegetable","sabzi"),
              Imgs("481","482","483")),

            P(fv, "Bitter Gourd", "bitter-gourd",
              "Fresh karela known for blood-sugar regulation benefits.",
              Vs(V("250g", 25, null, 80), V("500g", 45, 49, 60)),
              As(A("Type","Desi Karela"), A("Origin","Maharashtra")),
              Tags("bitter gourd","karela","vegetable","sabzi","healthy"),
              Imgs("484","485","486")),

            P(fv, "Lady Finger", "lady-finger",
              "Tender bhindi perfect for stir-fry and masala dishes.",
              Vs(V("250g", 25, null, 80), V("500g", 45, 49, 60)),
              As(A("Type","Bhindi"), A("Origin","Maharashtra")),
              Tags("lady finger","bhindi","okra","vegetable","sabzi"),
              Imgs("487","488","489")),

            P(fv, "Fresh Green Peas", "fresh-green-peas",
              "Sweet and tender green peas freshly shelled.",
              Vs(V("250g", 35, null, 70), V("500g", 65, 69, 50)),
              As(A("Type","Garden Peas"), A("Origin","Punjab"), A("Storage","Refrigerate")),
              Tags("peas","matar","vegetable","green peas","sabzi"),
              Imgs("490","491","492")),

            P(fv, "Sweet Potato", "sweet-potato",
              "Naturally sweet and nutritious shakarkandi.",
              Vs(V("500g", 39, null, 70), V("1 kg", 72, 79, 50)),
              As(A("Type","Orange Flesh"), A("Origin","Uttar Pradesh")),
              Tags("sweet potato","shakarkandi","vegetable","winter vegetable"),
              Imgs("493","494","495")),

            P(fv, "Beetroot", "beetroot",
              "Fresh deep-red beetroot packed with iron and folate.",
              Vs(V("250g", 29, null, 80), V("500g", 49, 55, 60)),
              As(A("Type","Red Globe"), A("Origin","Maharashtra")),
              Tags("beetroot","chukandar","vegetable","root vegetable"),
              Imgs("496","497","498")),

            P(fv, "Garlic", "garlic",
              "Fresh Indian garlic with pungent aroma, essential spice.",
              Vs(V("100g", 19, null, 100), V("250g", 39, 45, 80)),
              As(A("Type","Desi Garlic"), A("Origin","Madhya Pradesh")),
              Tags("garlic","lahsun","spice","condiment"),
              Imgs("499","500","501")),

            P(fv, "Ginger", "ginger",
              "Pungent and aromatic fresh ginger root.",
              Vs(V("100g", 15, null, 100), V("250g", 29, 33, 80)),
              As(A("Type","Fresh Ginger"), A("Origin","Kerala")),
              Tags("ginger","adrak","spice","condiment","root"),
              Imgs("502","503","504")),

            P(fv, "Green Chilli", "green-chilli",
              "Spicy fresh green chillies for everyday cooking.",
              Vs(V("100g", 12, null, 100), V("250g", 25, 28, 80)),
              As(A("Type","Bullet Chilli"), A("Origin","Maharashtra")),
              Tags("chilli","hari mirch","spice","condiment","sabzi"),
              Imgs("505","506","507")),

            P(fv, "Drumstick", "drumstick",
              "Tender moringa drumsticks rich in iron and calcium.",
              Vs(V("4 pcs", 29, null, 60), V("8 pcs", 49, 55, 40)),
              As(A("Type","Moringa"), A("Origin","Tamil Nadu")),
              Tags("drumstick","sahjan","moringa","vegetable","sabzi"),
              Imgs("508","509","510")),

            P(fv, "Pineapple", "pineapple",
              "Tangy tropical pineapple perfect for juices and desserts.",
              Vs(V("1 piece (~1kg)", 79, 89, 40)),
              As(A("Variety","Kew"), A("Origin","Kerala")),
              Tags("pineapple","ananas","fruit","tropical fruit"),
              Imgs("511","512","513")),
        });

        // ── 2. DAIRY & EGGS ───────────────────────────────────────────────────
        var dairy = cats["dairy-eggs"];

        products.AddRange(new[]
        {
            P(dairy, "Amul Taaza Toned Milk", "amul-taaza-toned-milk",
              "Amul Taaza is a pasteurised and homogenised toned milk.",
              Vs(V("500 ml", 30, null, 100), V("1 L", 57, null, 80), V("2 L", 114, null, 60)),
              As(A("Brand","Amul"), A("Type","Toned Milk"), A("Fat Content","3%"), A("SNF","8.5%")),
              Tags("milk","dairy","amul","toned milk","cow milk"),
              Imgs("227","228","229")),

            P(dairy, "Amul Gold Full Cream Milk", "amul-gold-full-cream-milk",
              "Rich and creamy full cream milk with 6% fat.",
              Vs(V("500 ml", 33, null, 100), V("1 L", 64, null, 80)),
              As(A("Brand","Amul"), A("Type","Full Cream Milk"), A("Fat Content","6%")),
              Tags("milk","dairy","amul","full cream","cow milk"),
              Imgs("230","231","232")),

            P(dairy, "Mother Dairy Toned Milk", "mother-dairy-toned-milk",
              "Mother Dairy's pure and fresh toned milk.",
              Vs(V("500 ml", 28, null, 100), V("1 L", 54, null, 80)),
              As(A("Brand","Mother Dairy"), A("Type","Toned Milk"), A("Fat","3%")),
              Tags("milk","dairy","mother dairy","toned milk"),
              Imgs("233","234","235")),

            P(dairy, "Amul Butter", "amul-butter",
              "Amul pasteurised butter with a rich creamy taste.",
              Vs(V("100 g", 57, null, 80), V("500 g", 269, null, 60)),
              As(A("Brand","Amul"), A("Type","Pasteurised Butter"), A("Fat","80%")),
              Tags("butter","dairy","amul","makhan"),
              Imgs("236","237","238")),

            P(dairy, "Amul Cheese Slices", "amul-cheese-slices",
              "Mild and creamy processed cheese slices, perfect for burgers and sandwiches.",
              Vs(V("200 g (10 slices)", 110, null, 70), V("400 g (20 slices)", 215, 225, 50)),
              As(A("Brand","Amul"), A("Type","Processed Cheese"), A("Pack of","10 slices")),
              Tags("cheese","dairy","amul","cheese slices","burger"),
              Imgs("239","240","241")),

            P(dairy, "Amul Fresh Paneer", "amul-fresh-paneer",
              "Soft and fresh Amul paneer made from pure cow's milk.",
              Vs(V("200 g", 75, null, 80), V("400 g", 145, 155, 60)),
              As(A("Brand","Amul"), A("Type","Fresh Paneer"), A("Fat","20%")),
              Tags("paneer","cheese","dairy","amul","cottage cheese"),
              Imgs("242","243","244")),

            P(dairy, "Amul Dahi Curd", "amul-dahi-curd",
              "Thick and creamy Amul dahi made from full cream milk.",
              Vs(V("200 g", 28, null, 100), V("400 g", 52, null, 80), V("1 kg", 118, null, 50)),
              As(A("Brand","Amul"), A("Type","Set Curd"), A("Fat","4%")),
              Tags("dahi","curd","yogurt","dairy","amul"),
              Imgs("245","246","247")),

            P(dairy, "Nestle a+ Slim Milk", "nestle-slim-milk",
              "Double toned milk with reduced fat for a healthier choice.",
              Vs(V("500 ml", 26, null, 80), V("1 L", 50, null, 60)),
              As(A("Brand","Nestlé"), A("Type","Double Toned Milk"), A("Fat","1.5%")),
              Tags("milk","dairy","nestle","slim milk","diet milk"),
              Imgs("248","249","250")),

            P(dairy, "Britannia Cheese Spread", "britannia-cheese-spread",
              "Soft spreadable cheese with a mild creamy flavour.",
              Vs(V("180 g", 85, 89, 60)),
              As(A("Brand","Britannia"), A("Type","Cheese Spread"), A("Flavour","Original")),
              Tags("cheese","cheese spread","dairy","britannia","bread spread"),
              Imgs("251","252","253")),

            P(dairy, "Go Cheese Slices", "go-cheese-slices",
              "Go processed cheese slices, smooth and consistent melt.",
              Vs(V("200 g", 108, null, 60), V("400 g", 210, 225, 40)),
              As(A("Brand","Go Cheese"), A("Type","Processed Cheese"), A("Pack of","10 slices")),
              Tags("cheese","go cheese","dairy","cheese slices"),
              Imgs("254","255","256")),

            P(dairy, "Amul Pure Ghee", "amul-pure-ghee",
              "Amul pure cow ghee with rich flavour and traditional taste.",
              Vs(V("200 g", 119, null, 80), V("500 g", 290, null, 60), V("1 L", 575, null, 40)),
              As(A("Brand","Amul"), A("Type","Pure Cow Ghee"), A("Clarified Butter","Yes")),
              Tags("ghee","dairy","amul","clarified butter","desi ghee"),
              Imgs("257","258","259")),

            P(dairy, "Mother Dairy Pure Ghee", "mother-dairy-pure-ghee",
              "Pure cow ghee from Mother Dairy with a traditional aroma.",
              Vs(V("500 g", 285, null, 60), V("1 L", 565, null, 40)),
              As(A("Brand","Mother Dairy"), A("Type","Pure Cow Ghee")),
              Tags("ghee","dairy","mother dairy","clarified butter"),
              Imgs("260","261","262")),

            P(dairy, "Eggs (White)", "eggs-white",
              "Fresh farm eggs, white shell, medium size.",
              Vs(V("6 pcs", 65, null, 100), V("12 pcs", 125, 130, 80), V("30 pcs", 299, 315, 50)),
              As(A("Type","White Egg"), A("Size","Medium"), A("Origin","Farm Fresh")),
              Tags("eggs","anda","dairy","protein","breakfast"),
              Imgs("263","264","265")),

            P(dairy, "Mother Dairy Fresh Paneer", "mother-dairy-fresh-paneer",
              "Soft cottage cheese from Mother Dairy.",
              Vs(V("200 g", 72, null, 80), V("400 g", 140, 149, 60)),
              As(A("Brand","Mother Dairy"), A("Type","Fresh Paneer")),
              Tags("paneer","cottage cheese","dairy","mother dairy"),
              Imgs("266","267","268")),

            P(dairy, "Nestle Milkmaid", "nestle-milkmaid",
              "Condensed sweetened milk ideal for desserts and sweets.",
              Vs(V("200 g", 72, null, 70), V("400 g", 140, 149, 50)),
              As(A("Brand","Nestlé"), A("Type","Sweetened Condensed Milk")),
              Tags("milkmaid","condensed milk","dairy","nestle","baking"),
              Imgs("269","270","271")),

            P(dairy, "Amul Buttermilk Spiced", "amul-buttermilk-spiced",
              "Chilled spiced buttermilk with a tangy refreshing taste.",
              Vs(V("200 ml", 20, null, 100), V("500 ml", 45, null, 80)),
              As(A("Brand","Amul"), A("Type","Spiced Buttermilk"), A("Fat","1.5%")),
              Tags("chaas","buttermilk","dairy","amul","summer drink"),
              Imgs("272","273","274")),

            P(dairy, "Amul Lassi", "amul-lassi",
              "Thick sweet lassi made from real dahi.",
              Vs(V("200 ml", 25, null, 100), V("1 L", 99, null, 60)),
              As(A("Brand","Amul"), A("Type","Sweet Lassi"), A("Flavour","Plain")),
              Tags("lassi","dairy","amul","yogurt drink","sweet lassi"),
              Imgs("275","276","277")),

            P(dairy, "Mother Dairy Curd", "mother-dairy-curd",
              "Thick and creamy set curd from Mother Dairy.",
              Vs(V("400 g", 48, null, 80), V("1 kg", 115, 120, 60)),
              As(A("Brand","Mother Dairy"), A("Type","Set Curd"), A("Fat","3%")),
              Tags("dahi","curd","dairy","mother dairy","yogurt"),
              Imgs("278","279","280")),

            P(dairy, "Amul Mozzarella Cheese", "amul-mozzarella-cheese",
              "Stretchy mozzarella cheese ideal for pizzas.",
              Vs(V("200 g", 120, null, 50), V("400 g", 235, 249, 30)),
              As(A("Brand","Amul"), A("Type","Mozzarella"), A("Moisture","Regular")),
              Tags("mozzarella","cheese","dairy","amul","pizza cheese"),
              Imgs("281","282","283")),

            P(dairy, "Amul Cream", "amul-cream",
              "Rich fresh cream for cooking, desserts and coffee.",
              Vs(V("200 g", 60, null, 70)),
              As(A("Brand","Amul"), A("Type","Fresh Cream"), A("Fat","25%")),
              Tags("cream","fresh cream","dairy","amul","cooking cream"),
              Imgs("284","285","286")),

            P(dairy, "Britannia Cheese Triangle", "britannia-cheese-triangle",
              "Individually wrapped cheese portions in a convenient wedge shape.",
              Vs(V("120 g (8 pcs)", 70, null, 60), V("240 g (16 pcs)", 135, 140, 40)),
              As(A("Brand","Britannia"), A("Type","Processed Cheese"), A("Pack of","8 portions")),
              Tags("cheese","triangle","dairy","britannia","processed cheese"),
              Imgs("287","288","289")),

            P(dairy, "Amul Shrikhand Elaichi", "amul-shrikhand-elaichi",
              "Thick and sweet strained yogurt dessert flavoured with elaichi.",
              Vs(V("200 g", 70, null, 60), V("400 g", 135, 140, 40)),
              As(A("Brand","Amul"), A("Flavour","Elaichi"), A("Type","Shrikhand")),
              Tags("shrikhand","dessert","dairy","amul","sweet"),
              Imgs("290","291","292")),

            P(dairy, "Amul Kool Koko Drink", "amul-kool-koko",
              "Chilled chocolate flavoured milk drink.",
              Vs(V("200 ml", 25, null, 100), V("500 ml", 52, null, 80)),
              As(A("Brand","Amul"), A("Flavour","Chocolate"), A("Type","Flavoured Milk")),
              Tags("chocolate milk","flavoured milk","dairy","amul","kool"),
              Imgs("293","294","295")),

            P(dairy, "Vijaya Butter", "vijaya-butter",
              "Pasteurised salted butter from Andhra Pradesh cooperative.",
              Vs(V("100 g", 55, null, 70), V("500 g", 265, null, 50)),
              As(A("Brand","Vijaya"), A("Type","Salted Butter"), A("Fat","80%")),
              Tags("butter","dairy","vijaya","salted butter"),
              Imgs("296","297","298")),

            P(dairy, "Heritage Fresh Milk", "heritage-fresh-milk",
              "Pure and fresh toned milk from Heritage Foods.",
              Vs(V("500 ml", 28, null, 80), V("1 L", 54, null, 60)),
              As(A("Brand","Heritage"), A("Type","Toned Milk"), A("Fat","3%")),
              Tags("milk","dairy","heritage","toned milk"),
              Imgs("299","300","301")),

            P(dairy, "Amul Protein Drink", "amul-pro",
              "High-protein vanilla-flavoured whey and milk drink.",
              Vs(V("200 g", 115, null, 60), V("500 g", 265, null, 40)),
              As(A("Brand","Amul"), A("Flavour","Vanilla"), A("Protein per serving","18g")),
              Tags("protein drink","dairy","amul","health drink","protein"),
              Imgs("302","303","304")),

            P(dairy, "Nestlé Yogurt Vanilla", "nestle-yogurt-vanilla",
              "Smooth yogurt with real vanilla flavour.",
              Vs(V("120 g", 35, null, 70), V("400 g", 99, 105, 50)),
              As(A("Brand","Nestlé"), A("Flavour","Vanilla"), A("Type","Stirred Yogurt")),
              Tags("yogurt","dairy","nestle","flavoured yogurt","vanilla"),
              Imgs("305","306","307")),

            P(dairy, "Go Processed Cheese Block", "go-cheese-block",
              "Versatile processed cheese block — grate, slice or cube.",
              Vs(V("200 g", 105, null, 60)),
              As(A("Brand","Go Cheese"), A("Type","Processed Cheese Block")),
              Tags("cheese","dairy","go cheese","cheese block"),
              Imgs("308","309","310")),

            P(dairy, "Amul Taaza UHT Milk", "amul-taaza-uht",
              "UHT processed toned milk with 6-month shelf life.",
              Vs(V("500 ml", 34, null, 80), V("1 L", 65, null, 60)),
              As(A("Brand","Amul"), A("Type","UHT Toned Milk"), A("Shelf Life","6 months")),
              Tags("uht milk","milk","dairy","amul","long life milk"),
              Imgs("311","312","313")),

            P(dairy, "Brown Eggs (Free Range)", "brown-eggs-free-range",
              "Free range brown eggs with richer yolk colour and flavour.",
              Vs(V("6 pcs", 75, null, 80), V("12 pcs", 145, 149, 60)),
              As(A("Type","Brown Egg"), A("Size","Large"), A("Origin","Free Range Farm")),
              Tags("eggs","brown egg","free range","dairy","protein"),
              Imgs("314","315","316")),
        });

        // ── 3. SNACKS & MUNCHIES ──────────────────────────────────────────────
        var snacks = cats["snacks"];

        products.AddRange(new[]
        {
            P(snacks, "Lay's Classic Salted", "lays-classic-salted",
              "Thin and crispy potato chips with a classic salted flavour.",
              Vs(V("26 g", 20, null, 150), V("52 g", 35, null, 100), V("104 g", 60, null, 80)),
              As(A("Brand","Lay's"), A("Flavour","Classic Salted"), A("Type","Potato Chips")),
              Tags("chips","crisps","snack","lays","potato chips","munchies"),
              Imgs("315","316","317")),

            P(snacks, "Lay's Magic Masala", "lays-magic-masala",
              "India's favourite masala flavoured potato chips.",
              Vs(V("26 g", 20, null, 150), V("52 g", 35, null, 100), V("104 g", 60, null, 80)),
              As(A("Brand","Lay's"), A("Flavour","Magic Masala"), A("Type","Potato Chips")),
              Tags("chips","snack","lays","masala chips","munchies"),
              Imgs("318","319","320")),

            P(snacks, "Kurkure Masala Munch", "kurkure-masala-munch",
              "Spicy crunchy corn puffs in the popular masala munch flavour.",
              Vs(V("40 g", 20, null, 150), V("90 g", 40, null, 100), V("180 g", 75, null, 70)),
              As(A("Brand","Kurkure"), A("Flavour","Masala Munch"), A("Type","Corn Puff")),
              Tags("kurkure","snack","corn puff","masala","munchies","chips"),
              Imgs("321","322","323")),

            P(snacks, "Bingo Mad Angles Achaari Masti", "bingo-mad-angles",
              "Triangular chips with a tangy achaari masala flavour.",
              Vs(V("35 g", 20, null, 120), V("70 g", 35, null, 80)),
              As(A("Brand","Bingo"), A("Flavour","Achaari Masti"), A("Type","Flavoured Chips")),
              Tags("bingo","snack","chips","achaari","munchies"),
              Imgs("324","325","326")),

            P(snacks, "Haldiram's Aloo Bhujia", "haldirams-aloo-bhujia",
              "Iconic crunchy aloo bhujia namkeen from Haldiram's.",
              Vs(V("200 g", 85, null, 80), V("400 g", 165, 175, 60), V("1 kg", 385, 410, 30)),
              As(A("Brand","Haldiram's"), A("Type","Bhujia"), A("Key Ingredient","Potato"), A("Country of Origin","India")),
              Tags("bhujia","namkeen","haldirams","snack","aloo bhujia","diwali snack"),
              Imgs("327","328","329")),

            P(snacks, "Haldiram's Moong Dal", "haldirams-moong-dal",
              "Crispy fried moong dal with a spicy masala coating.",
              Vs(V("200 g", 80, null, 80), V("400 g", 155, 165, 60)),
              As(A("Brand","Haldiram's"), A("Type","Dal Namkeen"), A("Key Ingredient","Moong Dal")),
              Tags("moong dal","namkeen","haldirams","snack","dal","munchies"),
              Imgs("330","331","332")),

            P(snacks, "Haldiram's Mixture", "haldirams-mixture",
              "Assorted namkeen mix with nuts, sev and fried lentils.",
              Vs(V("200 g", 80, null, 80), V("400 g", 155, 165, 60)),
              As(A("Brand","Haldiram's"), A("Type","Mixture Namkeen")),
              Tags("mixture","namkeen","haldirams","snack","assorted"),
              Imgs("333","334","335")),

            P(snacks, "Bikaji Aloo Bhujia", "bikaji-aloo-bhujia",
              "Bikaji's famous aloo bhujia made from authentic recipe.",
              Vs(V("200 g", 78, null, 80), V("400 g", 150, 159, 60)),
              As(A("Brand","Bikaji"), A("Type","Aloo Bhujia")),
              Tags("bhujia","namkeen","bikaji","snack","aloo bhujia"),
              Imgs("336","337","338")),

            P(snacks, "Parle-G Original Gluco Biscuits", "parle-g-original",
              "India's most loved glucose biscuits since 1939.",
              Vs(V("250 g", 25, null, 200), V("800 g", 75, null, 100)),
              As(A("Brand","Parle"), A("Type","Glucose Biscuit"), A("Flavour","Original")),
              Tags("parle g","biscuit","glucose biscuit","parle","snack","tiffin"),
              Imgs("339","340","341")),

            P(snacks, "Monaco Classic Biscuits", "monaco-classic",
              "Light and crispy salted crackers — perfect with tea.",
              Vs(V("88 g", 20, null, 120), V("200 g", 45, null, 80)),
              As(A("Brand","Parle"), A("Type","Cracker Biscuit"), A("Flavour","Salted")),
              Tags("monaco","biscuit","cracker","parle","snack","salted cracker"),
              Imgs("342","343","344")),

            P(snacks, "Britannia Good Day Butter Cookies", "britannia-good-day-butter",
              "Rich butter cookies with a melt-in-mouth texture.",
              Vs(V("87 g", 25, null, 120), V("250 g", 60, null, 80)),
              As(A("Brand","Britannia"), A("Type","Cookie"), A("Flavour","Butter")),
              Tags("good day","cookie","biscuit","britannia","butter cookie","snack"),
              Imgs("345","346","347")),

            P(snacks, "Britannia Bourbon Chocolate", "britannia-bourbon",
              "Two chocolate biscuits sandwiched with chocolate cream.",
              Vs(V("100 g", 25, null, 120), V("200 g", 45, null, 80)),
              As(A("Brand","Britannia"), A("Type","Cream Biscuit"), A("Flavour","Chocolate")),
              Tags("bourbon","biscuit","chocolate","britannia","cream biscuit","snack"),
              Imgs("348","349","350")),

            P(snacks, "Oreo Original Cookies", "oreo-original",
              "Classic chocolate sandwich cookies with vanilla cream filling.",
              Vs(V("120 g", 35, null, 100), V("300 g", 80, null, 70)),
              As(A("Brand","Oreo"), A("Type","Sandwich Cookie"), A("Flavour","Original"), A("Country of Origin","India")),
              Tags("oreo","cookie","chocolate cookie","cream biscuit","snack"),
              Imgs("351","352","353")),

            P(snacks, "Britannia Dark Fantasy Choco Fills", "britannia-dark-fantasy",
              "Indulgent chocolate-filled cookies with a dark centre.",
              Vs(V("75 g", 30, null, 100), V("150 g", 55, null, 70)),
              As(A("Brand","Britannia"), A("Type","Filled Cookie"), A("Flavour","Choco Fills")),
              Tags("dark fantasy","cookie","chocolate","britannia","choco fills"),
              Imgs("354","355","356")),

            P(snacks, "Pringles Original Potato Chips", "pringles-original",
              "Stackable potato crisps in the iconic Pringles can.",
              Vs(V("100 g", 99, null, 60), V("158 g", 149, 159, 40)),
              As(A("Brand","Pringles"), A("Flavour","Original"), A("Type","Potato Crisps")),
              Tags("pringles","chips","crisps","snack","imported chips"),
              Imgs("357","358","359")),

            P(snacks, "Uncle Chipps Classic Salted", "uncle-chipps-classic",
              "Thick and crunchy potato chips in classic salted flavour.",
              Vs(V("26 g", 20, null, 120), V("52 g", 35, null, 80)),
              As(A("Brand","Uncle Chipps"), A("Flavour","Classic Salted"), A("Type","Potato Chips")),
              Tags("uncle chipps","chips","snack","potato chips","munchies"),
              Imgs("360","361","362")),

            P(snacks, "Bingo Tedhe Medhe Masala", "bingo-tedhe-medhe",
              "Uniquely shaped masala snack with a spicy tangy taste.",
              Vs(V("50 g", 20, null, 120), V("100 g", 35, null, 80)),
              As(A("Brand","Bingo"), A("Flavour","Masala"), A("Type","Corn Snack")),
              Tags("bingo","tedhe medhe","snack","masala","munchies"),
              Imgs("363","364","365")),

            P(snacks, "Too Yumm Multigrain Chips", "too-yumm-multigrain",
              "Baked multigrain chips — 45% less fat than regular chips.",
              Vs(V("45 g", 25, null, 100), V("90 g", 45, null, 70)),
              As(A("Brand","Too Yumm"), A("Type","Baked Multigrain Chips"), A("Fat","45% less")),
              Tags("too yumm","baked chips","multigrain","snack","healthy snack"),
              Imgs("366","367","368")),

            P(snacks, "Parle Krackjack Sweet & Salty", "parle-krackjack",
              "Iconic sweet and salty cracker with sesame seeds.",
              Vs(V("200 g", 35, null, 100), V("400 g", 65, null, 70)),
              As(A("Brand","Parle"), A("Type","Cracker"), A("Flavour","Sweet & Salty")),
              Tags("krackjack","cracker","biscuit","parle","snack","sweet salty"),
              Imgs("369","370","371")),

            P(snacks, "Britannia NutriChoice Oats Cookies", "britannia-nutrichoice-oats",
              "Wholesome oats cookies enriched with oats and ragi.",
              Vs(V("150 g", 45, null, 80), V("350 g", 95, null, 60)),
              As(A("Brand","Britannia"), A("Type","Oats Cookie"), A("Grain","Oats & Ragi")),
              Tags("nutrichoice","oats","cookie","britannia","healthy biscuit"),
              Imgs("372","373","374")),

            P(snacks, "McVitie's Digestive Biscuits", "mcvities-digestive",
              "Wholesome wholemeal digestive biscuits — a British classic.",
              Vs(V("250 g", 75, null, 60), V("500 g", 140, 150, 40)),
              As(A("Brand","McVitie's"), A("Type","Digestive Biscuit"), A("Grain","Wholemeal")),
              Tags("digestive","biscuit","mcvities","snack","wheat biscuit"),
              Imgs("375","376","377")),

            P(snacks, "Haldiram's Chana Dal", "haldirams-chana-dal",
              "Crispy fried chana dal namkeen with a spicy masala.",
              Vs(V("200 g", 75, null, 80), V("400 g", 145, 155, 60)),
              As(A("Brand","Haldiram's"), A("Type","Dal Namkeen"), A("Key Ingredient","Chana Dal")),
              Tags("chana dal","namkeen","haldirams","snack","dal","diwali snack"),
              Imgs("378","379","380")),

            P(snacks, "Lotte Choco Pie", "lotte-choco-pie",
              "Soft chocolate-coated marshmallow cakes — a Korean classic.",
              Vs(V("168 g (6 pcs)", 75, 79, 60), V("336 g (12 pcs)", 145, 155, 40)),
              As(A("Brand","Lotte"), A("Type","Choco Pie"), A("Pack of","6 pcs")),
              Tags("chocopie","chocolate pie","lotte","snack","biscuit","choco"),
              Imgs("381","382","383")),

            P(snacks, "Lay's French Cheese Chips", "lays-french-cheese",
              "Potato chips with a rich French cheese flavour.",
              Vs(V("26 g", 20, null, 150), V("52 g", 35, null, 100)),
              As(A("Brand","Lay's"), A("Flavour","French Cheese"), A("Type","Potato Chips")),
              Tags("lays","chips","cheese chips","snack","french cheese"),
              Imgs("384","385","386")),

            P(snacks, "Haldiram's Khatta Meetha", "haldirams-khatta-meetha",
              "Sweet and tangy namkeen with sev, peanuts and spices.",
              Vs(V("200 g", 80, null, 80), V("400 g", 155, 165, 60)),
              As(A("Brand","Haldiram's"), A("Type","Mixture Namkeen"), A("Flavour","Khatta Meetha")),
              Tags("khatta meetha","namkeen","haldirams","snack","mixture"),
              Imgs("387","388","389")),

            P(snacks, "Bikaji Bikano Namkeen", "bikaji-bikano-namkeen",
              "Mixed namkeen assortment with boondi, sev and peanuts.",
              Vs(V("200 g", 75, null, 80), V("400 g", 145, 155, 60)),
              As(A("Brand","Bikaji"), A("Type","Mixed Namkeen")),
              Tags("bikaji","namkeen","snack","boondi","mixture"),
              Imgs("390","391","392")),

            P(snacks, "Kurkure Triangle Chips Masala", "kurkure-triangle",
              "Triangular shaped corn puffs with a crunchy masala bite.",
              Vs(V("40 g", 20, null, 120), V("90 g", 40, null, 80)),
              As(A("Brand","Kurkure"), A("Type","Corn Puff"), A("Shape","Triangle")),
              Tags("kurkure","triangle","snack","corn","masala","munchies"),
              Imgs("393","394","395")),

            P(snacks, "Britannia Treat Jam Rolls", "britannia-treat-jam",
              "Spongy cake rolls filled with strawberry jam.",
              Vs(V("40 g", 15, null, 150), V("200 g", 65, null, 80)),
              As(A("Brand","Britannia"), A("Type","Jam Roll"), A("Flavour","Strawberry")),
              Tags("jam roll","cake","britannia","treat","snack","tiffin"),
              Imgs("396","397","398")),

            P(snacks, "Haldiram's Peanuts Masala", "haldirams-peanuts-masala",
              "Crunchy roasted peanuts coated in spicy masala.",
              Vs(V("200 g", 65, null, 80), V("400 g", 125, 135, 60)),
              As(A("Brand","Haldiram's"), A("Type","Masala Peanuts")),
              Tags("peanuts","moongphali","namkeen","haldirams","roasted peanut","snack"),
              Imgs("399","400","401")),
        });

        // ── 4. BEVERAGES ──────────────────────────────────────────────────────
        var beverages = cats["beverages"];

        products.AddRange(new[]
        {
            P(beverages, "Thums Up Soft Drink", "thums-up",
              "India's favourite bold and robust cola drink.",
              Vs(V("8 x 250 ml", 160, null, 50), V("16 x 250 ml", 317, 320, 30)),
              As(A("Brand","Thums Up"), A("Pack of","8 bottles"), A("Type","Cola"), A("Country of Origin","India")),
              Tags("soft drink","cola","fizzy drink","cold drink","beverage","cola drink","thums up"),
              Imgs("449","450","451")),

            P(beverages, "Coca-Cola Classic", "coca-cola-classic",
              "The world's most popular cola with its iconic flavour.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80), V("1.25 L", 65, null, 60), V("2 L", 89, null, 40)),
              As(A("Brand","Coca-Cola"), A("Type","Cola"), A("Country of Origin","India")),
              Tags("cola","coke","soft drink","cold drink","beverage","coca cola"),
              Imgs("452","453","454")),

            P(beverages, "Pepsi Cola", "pepsi-cola",
              "Refreshing cola with Pepsi's distinctive sweet taste.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80), V("2 L", 89, null, 40)),
              As(A("Brand","Pepsi"), A("Type","Cola"), A("Country of Origin","India")),
              Tags("pepsi","cola","soft drink","cold drink","beverage","fizzy"),
              Imgs("455","456","457")),

            P(beverages, "Sprite Lemon Lime", "sprite-lemon-lime",
              "Crisp and clear lemon-lime flavoured sparkling drink.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80), V("2 L", 89, null, 40)),
              As(A("Brand","Sprite"), A("Type","Lemon-Lime Soda"), A("Caffeine Free","Yes")),
              Tags("sprite","lemon lime","soft drink","cold drink","soda","fizzy"),
              Imgs("458","459","460")),

            P(beverages, "Limca Lemon Drink", "limca",
              "Tangy lemon-lime flavoured refreshing drink.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80)),
              As(A("Brand","Limca"), A("Type","Lemon Drink")),
              Tags("limca","lemon","soft drink","cold drink","fizzy drink"),
              Imgs("461","462","463")),

            P(beverages, "Maaza Mango Drink", "maaza-mango",
              "Thick and juicy mango drink made from real Alfonso mangoes.",
              Vs(V("200 ml", 20, null, 100), V("600 ml", 45, null, 80), V("1 L", 65, null, 60)),
              As(A("Brand","Maaza"), A("Type","Mango Drink"), A("Fruit Content","13%")),
              Tags("maaza","mango","fruit drink","cold drink","beverage","mango juice"),
              Imgs("464","465","466")),

            P(beverages, "Frooti Fresh & Juicy Mango", "frooti-mango",
              "Frooti's classic mango drink — India's favourite mango flavour.",
              Vs(V("200 ml", 20, null, 100), V("500 ml", 40, null, 80), V("1 L", 65, null, 60)),
              As(A("Brand","Frooti"), A("Type","Mango Drink"), A("Fruit Content","10%")),
              Tags("frooti","mango","fruit drink","cold drink","beverage","juice"),
              Imgs("467","468","469")),

            P(beverages, "Tropicana 100% Orange Juice", "tropicana-orange",
              "100% pure orange juice with no added sugar.",
              Vs(V("1 L", 120, 130, 50), V("2 L", 225, 240, 30)),
              As(A("Brand","Tropicana"), A("Type","100% Juice"), A("Flavour","Orange"), A("Added Sugar","None")),
              Tags("tropicana","orange juice","juice","100% juice","no added sugar","healthy drink"),
              Imgs("470","471","472")),

            P(beverages, "Red Bull Energy Drink", "red-bull",
              "Red Bull Energy Drink with caffeine, taurine and B vitamins.",
              Vs(V("250 ml", 125, null, 50), V("4 x 250 ml", 469, 490, 30)),
              As(A("Brand","Red Bull"), A("Type","Energy Drink"), A("Caffeine","80mg per can")),
              Tags("red bull","energy drink","caffeine","beverage","sports drink"),
              Imgs("473","474","475")),

            P(beverages, "Mountain Dew", "mountain-dew",
              "Bold and citrus-flavoured green soda with a unique taste.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80), V("2 L", 89, null, 40)),
              As(A("Brand","Mountain Dew"), A("Type","Citrus Soda")),
              Tags("mountain dew","dew","citrus","soft drink","cold drink","soda"),
              Imgs("476","477","478")),

            P(beverages, "Bisleri Mineral Water", "bisleri-water",
              "Pure and safe Bisleri packaged drinking water.",
              Vs(V("1 L", 20, null, 100), V("2 L", 30, null, 80), V("5 L", 60, null, 50)),
              As(A("Brand","Bisleri"), A("Type","Packaged Drinking Water"), A("TDS","<50 ppm")),
              Tags("water","mineral water","bisleri","drinking water","packaged water"),
              Imgs("479","480","481")),

            P(beverages, "Kinley Soda Water", "kinley-soda",
              "Refreshing carbonated soda water by Coca-Cola.",
              Vs(V("400 ml", 20, null, 100), V("750 ml", 30, null, 80)),
              As(A("Brand","Kinley"), A("Type","Carbonated Soda Water")),
              Tags("soda water","kinley","soda","beverage","sparkling water"),
              Imgs("482","483","484")),

            P(beverages, "Appy Fizz Apple Drink", "appy-fizz",
              "Sparkling apple drink with a fruity fizzy taste.",
              Vs(V("250 ml", 25, null, 100), V("500 ml", 45, null, 80)),
              As(A("Brand","Appy Fizz"), A("Type","Apple Sparkling Drink"), A("Fruit Content","12%")),
              Tags("appy fizz","apple","sparkling","fruit drink","cold drink","fizzy"),
              Imgs("485","486","487")),

            P(beverages, "Paper Boat Aamras Mango Drink", "paper-boat-aamras",
              "Traditional aamras made from Kesar mangoes — no artificial colour.",
              Vs(V("200 ml", 30, null, 80), V("1 L", 120, 130, 50)),
              As(A("Brand","Paper Boat"), A("Type","Aamras"), A("No Artificial Colour","Yes")),
              Tags("paper boat","aamras","mango","juice","traditional drink","no artificial colour"),
              Imgs("488","489","490")),

            P(beverages, "7Up Lemon Drink", "7up",
              "Crisp and refreshing lemon-lime flavoured drink.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80), V("2 L", 89, null, 40)),
              As(A("Brand","7Up"), A("Type","Lemon-Lime Soda"), A("Caffeine Free","Yes")),
              Tags("7up","lemon","soft drink","soda","cold drink","caffeine free"),
              Imgs("491","492","493")),

            P(beverages, "Mirinda Orange Soda", "mirinda-orange",
              "Bright and flavourful orange soda with a bold taste.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80)),
              As(A("Brand","Mirinda"), A("Type","Orange Soda"), A("Flavour","Orange")),
              Tags("mirinda","orange","soft drink","soda","cold drink","fizzy"),
              Imgs("494","495","496")),

            P(beverages, "Real Activ Orange Juice", "real-activ-orange",
              "Freshly squeezed style orange juice with no added sugar.",
              Vs(V("1 L", 115, 125, 50), V("2 L", 215, 230, 30)),
              As(A("Brand","Real Activ"), A("Type","100% Juice"), A("Flavour","Orange"), A("Added Sugar","No")),
              Tags("real","orange juice","juice","100% juice","no added sugar","healthy"),
              Imgs("497","498","499")),

            P(beverages, "Minute Maid Pulpy Orange", "minute-maid-pulpy",
              "Orange drink with juicy pulp pieces for a real fruity experience.",
              Vs(V("400 ml", 35, null, 80), V("1 L", 75, null, 60)),
              As(A("Brand","Minute Maid"), A("Flavour","Orange"), A("Pulp","Yes")),
              Tags("minute maid","orange","juice","pulp","cold drink","beverage"),
              Imgs("500","501","502")),

            P(beverages, "Nescafé Classic Instant Coffee", "nescafe-classic",
              "Bold and rich instant coffee for a great morning cup.",
              Vs(V("50 g", 165, 175, 60), V("100 g", 299, 320, 40), V("200 g", 565, 600, 30)),
              As(A("Brand","Nescafé"), A("Type","Instant Coffee"), A("Roast","Dark Roast")),
              Tags("nescafe","coffee","instant coffee","beverage","caffeine"),
              Imgs("503","504","505")),

            P(beverages, "Bru Gold Coffee", "bru-gold-coffee",
              "Premium roasted and ground coffee for a rich flavour.",
              Vs(V("50 g", 150, 159, 60), V("100 g", 275, 299, 40), V("200 g", 525, 559, 30)),
              As(A("Brand","Bru"), A("Type","Roasted & Ground Coffee"), A("Roast","Medium")),
              Tags("bru","coffee","bru gold","beverage","instant coffee"),
              Imgs("506","507","508")),

            P(beverages, "Lipton Green Tea Honey Lemon", "lipton-green-tea",
              "Refreshing honey lemon green tea bags with natural antioxidants.",
              Vs(V("25 bags", 115, null, 60), V("100 bags", 379, 399, 40)),
              As(A("Brand","Lipton"), A("Type","Green Tea"), A("Flavour","Honey Lemon"), A("Antioxidants","Yes")),
              Tags("lipton","green tea","tea","honey lemon","healthy drink","antioxidant"),
              Imgs("509","510","511")),

            P(beverages, "Horlicks Health Drink", "horlicks",
              "Nutritious malted health drink for the whole family.",
              Vs(V("200 g", 130, null, 60), V("500 g", 299, null, 40), V("1 kg", 569, null, 30)),
              As(A("Brand","Horlicks"), A("Type","Health Drink"), A("Flavour","Original Malt"), A("Vitamins","23 Nutrients")),
              Tags("horlicks","health drink","malt","nutrition","beverage","kids drink"),
              Imgs("512","513","514")),

            P(beverages, "Boost Chocolate Energy Drink", "boost-energy",
              "Chocolate malted energy drink for growing children.",
              Vs(V("200 g", 130, null, 60), V("500 g", 299, null, 40), V("1 kg", 569, null, 30)),
              As(A("Brand","Boost"), A("Type","Energy Health Drink"), A("Flavour","Chocolate")),
              Tags("boost","health drink","energy drink","chocolate","malt","kids drink"),
              Imgs("515","516","517")),

            P(beverages, "Complan Chocolate Drink", "complan-chocolate",
              "Complete planned nutrition drink with 34 vital nutrients.",
              Vs(V("200 g", 130, null, 60), V("500 g", 299, null, 40)),
              As(A("Brand","Complan"), A("Flavour","Chocolate"), A("Nutrients","34 vital nutrients")),
              Tags("complan","health drink","nutrition","chocolate","kids drink"),
              Imgs("518","519","520")),

            P(beverages, "Fanta Orange Soda", "fanta-orange",
              "Bright and bubbly orange soda with a sweet citrus taste.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80)),
              As(A("Brand","Fanta"), A("Type","Orange Soda"), A("Flavour","Orange")),
              Tags("fanta","orange","soft drink","soda","cold drink","citrus"),
              Imgs("521","522","523")),

            P(beverages, "Amul Tru Mango Drink", "amul-tru-mango",
              "Real mango drink with 30% fruit content and no added colour.",
              Vs(V("200 ml", 20, null, 100), V("1 L", 85, null, 60)),
              As(A("Brand","Amul"), A("Type","Mango Drink"), A("Fruit Content","30%"), A("No Added Colour","Yes")),
              Tags("amul","mango","fruit drink","tru","cold drink","natural"),
              Imgs("524","525","526")),

            P(beverages, "Tetley Masala Chai Tea Bags", "tetley-masala-chai",
              "Strong masala chai with ginger and cardamom for a perfect cup.",
              Vs(V("25 bags", 85, 89, 60), V("100 bags", 299, 320, 40)),
              As(A("Brand","Tetley"), A("Type","Masala Chai"), A("Flavour","Ginger & Cardamom")),
              Tags("tetley","chai","masala tea","tea bag","beverage","ginger"),
              Imgs("527","528","529")),

            P(beverages, "B Natural Mixed Fruit Juice", "b-natural-mixed-fruit",
              "No added sugar mixed fruit juice from ITC — real fruit goodness.",
              Vs(V("1 L", 99, 110, 50)),
              As(A("Brand","B Natural"), A("Type","Mixed Fruit Juice"), A("Added Sugar","None")),
              Tags("b natural","mixed fruit","juice","no added sugar","healthy","itc"),
              Imgs("530","531","532")),

            P(beverages, "Paper Boat Jaljeera Drink", "paper-boat-jaljeera",
              "Tangy and refreshing jaljeera drink — the taste of Indian summers.",
              Vs(V("200 ml", 25, null, 80), V("750 ml", 80, null, 50)),
              As(A("Brand","Paper Boat"), A("Type","Jaljeera"), A("No Artificial Colour","Yes")),
              Tags("paper boat","jaljeera","drink","traditional","refreshing","summer drink"),
              Imgs("533","534","535")),

            P(beverages, "Mountain Dew Ice", "mountain-dew-ice",
              "Icy and refreshing Mountain Dew with a cool mint finish.",
              Vs(V("250 ml", 20, null, 100), V("500 ml", 35, null, 80)),
              As(A("Brand","Mountain Dew"), A("Type","Citrus Mint Soda"), A("Variant","Ice")),
              Tags("mountain dew","dew ice","mint","soft drink","cold drink","soda"),
              Imgs("536","537","538")),
        });

        // ── 5. BREAD & BAKERY ─────────────────────────────────────────────────
        var bakery = cats["bakery"];

        products.AddRange(new[]
        {
            P(bakery, "Britannia Sandwich Bread", "britannia-sandwich-bread",
              "Soft sandwich bread for breakfast and snacks.",
              Vs(V("400 g", 45, null, 100), V("700 g", 65, null, 80)),
              As(A("Brand","Britannia"), A("Type","Sandwich Bread"), A("Shelf Life","3 days")),
              Tags("bread","sandwich bread","britannia","white bread","breakfast"),
              Imgs("539","540","541")),

            P(bakery, "English Oven Sandwich Bread", "english-oven-sandwich-bread",
              "Premium soft sandwich bread with a light and fluffy texture.",
              Vs(V("400 g", 49, null, 100), V("600 g", 69, null, 70)),
              As(A("Brand","English Oven"), A("Type","Sandwich Bread"), A("Shelf Life","3 days")),
              Tags("bread","sandwich bread","english oven","white bread","bakery"),
              Imgs("542","543","544")),

            P(bakery, "Harvest Gold Sandwich Bread", "harvest-gold-sandwich-bread",
              "Freshly baked soft sandwich bread from Harvest Gold.",
              Vs(V("400 g", 44, null, 100)),
              As(A("Brand","Harvest Gold"), A("Type","Sandwich Bread"), A("Shelf Life","3 days")),
              Tags("bread","sandwich bread","harvest gold","white bread","breakfast"),
              Imgs("545","546","547")),

            P(bakery, "Britannia Whole Wheat Brown Bread", "britannia-whole-wheat-bread",
              "100% whole wheat bread for a healthier bread choice.",
              Vs(V("400 g", 49, null, 80)),
              As(A("Brand","Britannia"), A("Type","Whole Wheat Bread"), A("Fibre","3.5g per serve")),
              Tags("whole wheat bread","brown bread","britannia","healthy bread","high fibre"),
              Imgs("548","549","550")),

            P(bakery, "English Oven Multigrain Bread", "english-oven-multigrain-bread",
              "Multigrain bread with 7 grains — nutritious and delicious.",
              Vs(V("400 g", 60, null, 80)),
              As(A("Brand","English Oven"), A("Type","Multigrain Bread"), A("Grains","7")),
              Tags("multigrain bread","bread","english oven","healthy bread","whole grain"),
              Imgs("551","552","553")),

            P(bakery, "Britannia Pav Bread", "britannia-pav",
              "Soft and fluffy dinner rolls perfect for pav bhaji and vada pav.",
              Vs(V("6 pcs", 35, null, 100), V("12 pcs", 65, null, 80)),
              As(A("Brand","Britannia"), A("Type","Dinner Roll / Pav"), A("Pieces","6")),
              Tags("pav","bread roll","dinner roll","britannia","pav bhaji","bakery"),
              Imgs("554","555","556")),

            P(bakery, "English Oven Pav", "english-oven-pav",
              "Premium soft pav rolls ideal for street food at home.",
              Vs(V("6 pcs", 40, null, 100)),
              As(A("Brand","English Oven"), A("Type","Pav"), A("Pieces","6")),
              Tags("pav","bread roll","english oven","pav bhaji","bakery"),
              Imgs("557","558","559")),

            P(bakery, "Harvest Gold Burger Bun", "harvest-gold-burger-bun",
              "Round burger buns with a soft and light texture.",
              Vs(V("4 pcs", 35, null, 100), V("6 pcs", 50, null, 70)),
              As(A("Brand","Harvest Gold"), A("Type","Burger Bun"), A("Pieces","4")),
              Tags("burger bun","bun","harvest gold","bakery","burger"),
              Imgs("560","561","562")),

            P(bakery, "English Oven Hot Dog Bun", "english-oven-hot-dog-bun",
              "Elongated buns for hot dogs and sausage sandwiches.",
              Vs(V("4 pcs", 40, null, 80)),
              As(A("Brand","English Oven"), A("Type","Hot Dog Bun"), A("Pieces","4")),
              Tags("hot dog bun","bun","english oven","bakery","hot dog"),
              Imgs("563","564","565")),

            P(bakery, "Britannia Cake Slice", "britannia-cake-slice",
              "Individually wrapped soft cake slice for an on-the-go snack.",
              Vs(V("60 g", 20, null, 150), V("150 g", 45, null, 100)),
              As(A("Brand","Britannia"), A("Type","Cake Slice"), A("Flavour","Fruit Cake")),
              Tags("cake","cake slice","britannia","snack","sweet","bakery"),
              Imgs("566","567","568")),

            P(bakery, "Britannia Little Hearts Biscuits", "britannia-little-hearts",
              "Heart-shaped butter biscuits with a melt-in-mouth taste.",
              Vs(V("75 g", 20, null, 150), V("150 g", 35, null, 100)),
              As(A("Brand","Britannia"), A("Type","Butter Biscuit"), A("Shape","Heart")),
              Tags("little hearts","biscuit","britannia","heart","butter biscuit","snack"),
              Imgs("569","570","571")),

            P(bakery, "Britannia Toastea Rusk", "britannia-toastea-rusk",
              "Crunchy double-baked rusk perfect with morning chai.",
              Vs(V("200 g", 45, null, 100), V("400 g", 80, null, 70)),
              As(A("Brand","Britannia"), A("Type","Rusk"), A("Best With","Tea / Coffee")),
              Tags("rusk","toast","britannia","tea rusk","bakery","breakfast"),
              Imgs("572","573","574")),

            P(bakery, "Parle Rusk Toast", "parle-rusk",
              "Classic crispy rusk from Parle — a tea-time staple.",
              Vs(V("200 g", 40, null, 100), V("400 g", 75, null, 70)),
              As(A("Brand","Parle"), A("Type","Rusk")),
              Tags("rusk","parle","toast","tea rusk","bakery","breakfast"),
              Imgs("575","576","577")),

            P(bakery, "English Oven Croissant", "english-oven-croissant",
              "Buttery and flaky croissants freshly baked — ideal for breakfast.",
              Vs(V("2 pcs", 60, null, 70), V("4 pcs", 110, 120, 50)),
              As(A("Brand","English Oven"), A("Type","Croissant"), A("Butter","Yes")),
              Tags("croissant","bakery","english oven","breakfast","pastry","butter"),
              Imgs("578","579","580")),

            P(bakery, "Britannia Brown Bread", "britannia-brown-bread",
              "Healthy brown bread with fibre and a distinct earthy flavour.",
              Vs(V("400 g", 47, null, 80)),
              As(A("Brand","Britannia"), A("Type","Brown Bread"), A("Fibre","High")),
              Tags("brown bread","bread","britannia","healthy bread","bakery"),
              Imgs("581","582","583")),

            P(bakery, "English Oven Garlic Bread", "english-oven-garlic-bread",
              "Ready-to-bake garlic bread with real garlic and herbs.",
              Vs(V("150 g", 65, null, 60)),
              As(A("Brand","English Oven"), A("Type","Garlic Bread"), A("Flavour","Garlic & Herbs")),
              Tags("garlic bread","bread","english oven","bakery","ready to bake","snack"),
              Imgs("584","585","586")),

            P(bakery, "Anmol Butter Cookies", "anmol-butter-cookies",
              "Classic butter cookies baked to a golden crisp.",
              Vs(V("100 g", 20, null, 100), V("200 g", 35, null, 80)),
              As(A("Brand","Anmol"), A("Type","Butter Cookie")),
              Tags("anmol","butter cookie","cookie","biscuit","bakery","snack"),
              Imgs("587","588","589")),

            P(bakery, "Mrs Bector's Cremica Burger Bun", "mrs-bectors-burger-bun",
              "Sesame-topped burger buns with soft interior and firm crust.",
              Vs(V("4 pcs", 40, null, 80)),
              As(A("Brand","Mrs Bector's Cremica"), A("Type","Sesame Burger Bun"), A("Pieces","4")),
              Tags("burger bun","bun","mrs bectors","cremica","bakery","burger"),
              Imgs("590","591","592")),

            P(bakery, "English Oven Cheese Bread", "english-oven-cheese-bread",
              "Soft bread enriched with real cheese for a savoury breakfast.",
              Vs(V("400 g", 65, null, 70)),
              As(A("Brand","English Oven"), A("Type","Cheese Bread"), A("Flavour","Cheese")),
              Tags("cheese bread","bread","english oven","bakery","savoury"),
              Imgs("593","594","595")),

            P(bakery, "Harvest Gold Brown Bread", "harvest-gold-brown-bread",
              "Nutritious wholemeal brown bread from Harvest Gold.",
              Vs(V("400 g", 47, null, 80)),
              As(A("Brand","Harvest Gold"), A("Type","Brown Bread")),
              Tags("brown bread","bread","harvest gold","healthy bread","bakery"),
              Imgs("596","597","598")),

            P(bakery, "Britannia 50-50 Maska Chaska", "britannia-50-50",
              "Savoury and slightly sweet crackers with a unique masala bite.",
              Vs(V("200 g", 35, null, 100)),
              As(A("Brand","Britannia"), A("Type","Salted Cracker"), A("Flavour","Maska Chaska")),
              Tags("50-50","cracker","biscuit","britannia","bakery","salty sweet"),
              Imgs("599","600","601")),

            P(bakery, "English Oven Dinner Rolls", "english-oven-dinner-rolls",
              "Soft dinner rolls ideal for soups, pasta and continental meals.",
              Vs(V("4 pcs", 50, null, 80), V("8 pcs", 90, null, 60)),
              As(A("Brand","English Oven"), A("Type","Dinner Rolls"), A("Pieces","4")),
              Tags("dinner rolls","bread roll","english oven","bakery","continental"),
              Imgs("602","603","604")),

            P(bakery, "Britannia Vita Marie Biscuits", "britannia-vita-marie",
              "Light and crispy marie biscuits, a timeless tea-time classic.",
              Vs(V("250 g", 25, null, 120), V("500 g", 45, null, 80)),
              As(A("Brand","Britannia"), A("Type","Marie Biscuit")),
              Tags("vita marie","marie","biscuit","britannia","tea biscuit","light"),
              Imgs("605","606","607")),

            P(bakery, "Modern Bread Sandwich Loaf", "modern-bread",
              "Classic sandwich loaf from Modern Bakeries with a soft crumb.",
              Vs(V("400 g", 43, null, 80)),
              As(A("Brand","Modern Bakeries"), A("Type","Sandwich Bread")),
              Tags("modern bread","bread","sandwich bread","bakery","white bread"),
              Imgs("608","609","610")),

            P(bakery, "Britannia Cake Eggless", "britannia-cake-eggless",
              "Moist and rich eggless fruit cake for everyday indulgence.",
              Vs(V("250 g", 85, null, 60)),
              As(A("Brand","Britannia"), A("Type","Eggless Cake"), A("Flavour","Fruit")),
              Tags("cake","eggless cake","britannia","fruit cake","bakery","snack"),
              Imgs("611","612","613")),

            P(bakery, "Dukes Waffy Vanilla Wafers", "dukes-waffy-vanilla",
              "Crispy wafer rolls filled with smooth vanilla cream.",
              Vs(V("75 g", 20, null, 120), V("150 g", 35, null, 80)),
              As(A("Brand","Dukes"), A("Type","Wafer Roll"), A("Flavour","Vanilla")),
              Tags("wafer","vanilla wafer","dukes","snack","cream wafer","bakery"),
              Imgs("614","615","616")),

            P(bakery, "Cremica Mango Cream Biscuits", "cremica-mango-cream",
              "Mango flavoured cream biscuits with a tropical filling.",
              Vs(V("150 g", 30, null, 80), V("300 g", 55, null, 60)),
              As(A("Brand","Cremica"), A("Type","Cream Biscuit"), A("Flavour","Mango")),
              Tags("cream biscuit","mango","cremica","biscuit","snack","bakery"),
              Imgs("617","618","619")),

            P(bakery, "Harvest Gold Milk Bread", "harvest-gold-milk-bread",
              "Soft and slightly sweet milk bread — perfect for kids.",
              Vs(V("400 g", 49, null, 80)),
              As(A("Brand","Harvest Gold"), A("Type","Milk Bread"), A("Sweetness","Mild")),
              Tags("milk bread","bread","harvest gold","sweet bread","bakery","kids"),
              Imgs("620","621","622")),

            P(bakery, "Britannia Bread Rolls", "britannia-bread-rolls",
              "Soft round dinner rolls from Britannia for snacking and meals.",
              Vs(V("4 pcs", 35, null, 80)),
              As(A("Brand","Britannia"), A("Type","Dinner Roll"), A("Pieces","4")),
              Tags("bread roll","rolls","britannia","dinner roll","bakery"),
              Imgs("623","624","625")),
        });

        products.AddRange(BuildMeatFishProducts(cats["meat-fish"]));
        products.AddRange(BuildPersonalCareProducts(cats["personal-care"]));
        products.AddRange(BuildHouseholdProducts(cats["household"]));
        products.AddRange(BuildBabyCareProducts(cats["baby-care"]));
        products.AddRange(BuildPetCareProducts(cats["pet-care"]));
        products.AddRange(BuildPharmaProducts(cats["pharma"]));
        products.AddRange(BuildBeautyProducts(cats["beauty"]));
        products.AddRange(BuildFrozenFoodsProducts(cats["frozen-foods"]));
        products.AddRange(BuildBreakfastCerealsProducts(cats["breakfast-cereals"]));
        products.AddRange(BuildElectronicsProducts(cats["electronics"]));
        products.AddRange(BuildMasalaOilProducts(cats["masala-oil"]));

        await db.Products.AddRangeAsync(products);
        await db.SaveChangesAsync();
    }

    public static async Task SeedMissingCategoryProductsAsync(BlinkitDbContext db)
    {
        // Ensure masala-oil category exists (added after initial seed).
        if (!await db.Categories.IgnoreQueryFilters().AnyAsync(c => c.Slug == "masala-oil"))
        {
            var maxOrder = await db.Categories.IgnoreQueryFilters()
                                   .MaxAsync(c => (int?)c.DisplayOrder) ?? 15;
            await db.Categories.AddAsync(
                Cat("Masala, Oil & More", "masala-oil", CatImg("masala-oil"), maxOrder + 1));
            await db.SaveChangesAsync();
        }

        var slugsAndBuilders = new (string Slug, Func<Category, List<Product>> Builder)[]
        {
            ("meat-fish",          BuildMeatFishProducts),
            ("personal-care",      BuildPersonalCareProducts),
            ("household",          BuildHouseholdProducts),
            ("baby-care",          BuildBabyCareProducts),
            ("pet-care",           BuildPetCareProducts),
            ("pharma",             BuildPharmaProducts),
            ("beauty",             BuildBeautyProducts),
            ("frozen-foods",       BuildFrozenFoodsProducts),
            ("breakfast-cereals",  BuildBreakfastCerealsProducts),
            ("electronics",        BuildElectronicsProducts),
            ("masala-oil",         BuildMasalaOilProducts),
        };

        foreach (var (slug, builder) in slugsAndBuilders)
        {
            var cat = await db.Categories.IgnoreQueryFilters()
                              .FirstOrDefaultAsync(c => c.Slug == slug);
            if (cat is null) continue;
            if (await db.Products.IgnoreQueryFilters().AnyAsync(p => p.CategoryId == cat.Id)) continue;

            await db.Products.AddRangeAsync(builder(cat));
            await db.SaveChangesAsync();
        }
    }

    private static List<Product> BuildMeatFishProducts(Category cat) =>
    [
        P(cat, "Fresh Chicken Breast", "fresh-chicken-breast",
          "Tender boneless chicken breast from premium farms, cleaned and ready to cook. Rich in lean protein, ideal for grilling, baking or curries.",
          Vs(V("250g", 149, null, 60), V("500g", 279, 299, 40), V("1kg", 529, 559, 25)),
          As(A("Brand","FreshToHome"), A("Type","Boneless"), A("Storage","Refrigerate below 4°C")),
          Tags("chicken","protein","fresh","non-veg"),
          Imgs("700","701","702")),

        P(cat, "Chicken Curry Cut", "chicken-curry-cut",
          "Bone-in chicken pieces cut into curry-ready portions, freshly processed. Perfect for making rich Indian gravies and kormas.",
          Vs(V("500g", 199, null, 50), V("1kg", 379, 399, 30)),
          As(A("Brand","Licious"), A("Type","Curry Cut"), A("Origin","India")),
          Tags("chicken","curry","non-veg","fresh"),
          Imgs("703","704","705")),

        P(cat, "Chicken Drumsticks", "chicken-drumsticks",
          "Juicy chicken drumsticks great for grilling, frying or slow-cooking. Marinate and cook for a finger-licking experience.",
          Vs(V("500g", 179, null, 50), V("1kg", 339, 359, 30)),
          As(A("Type","Drumstick"), A("Storage","Refrigerate")),
          Tags("chicken","drumstick","grilled","bbq"),
          Imgs("706","707","708")),

        P(cat, "Chicken Minced", "chicken-minced",
          "Freshly minced chicken perfect for keema, meatballs and kebabs. Ground fine for quick even cooking.",
          Vs(V("250g", 129, null, 60), V("500g", 239, 259, 35)),
          As(A("Type","Minced"), A("Storage","Use within 24 hours of opening")),
          Tags("chicken","minced","keema","non-veg"),
          Imgs("709","710","711")),

        P(cat, "Whole Chicken", "whole-chicken",
          "Dressed whole chicken cleaned and ready for roasting or country-style cooking. Farm-fresh and delivered chilled.",
          Vs(V("800g-1kg", 299, null, 30), V("1kg-1.2kg", 369, 399, 20)),
          As(A("Type","Whole Dressed"), A("Storage","Refrigerate")),
          Tags("chicken","whole","roast","non-veg"),
          Imgs("712","713","714")),

        P(cat, "Chicken Wings", "chicken-wings",
          "Party-favourite chicken wings ideal for BBQ, frying or oven-baking. Meaty and full of flavour.",
          Vs(V("500g", 189, null, 50), V("1kg", 359, 379, 30)),
          As(A("Type","Wings"), A("Storage","Refrigerate")),
          Tags("chicken","wings","fry","bbq"),
          Imgs("715","716","717")),

        P(cat, "Eggs White 6pcs", "eggs-white-6pcs",
          "Fresh white-shelled farm eggs, packed at source for superior freshness. High in protein and essential amino acids.",
          Vs(V("6 pcs", 59, null, 100), V("12 pcs", 110, 119, 80), V("30 pcs", 259, 279, 40)),
          As(A("Brand","Vegapure"), A("Type","White Eggs"), A("Size","Large")),
          Tags("eggs","white","protein","breakfast"),
          Imgs("718","719","720")),

        P(cat, "Brown Eggs", "brown-eggs",
          "Naturally brown-shelled eggs from free-roaming hens with a rich flavour. Ideal for baking, omelettes and everyday cooking.",
          Vs(V("6 pcs", 69, null, 80), V("12 pcs", 129, 139, 60)),
          As(A("Type","Brown Eggs"), A("Size","Large"), A("Origin","Farm Fresh")),
          Tags("eggs","brown","breakfast","protein"),
          Imgs("721","722","723")),

        P(cat, "Omega-3 Enriched Eggs", "omega-3-eggs",
          "Nutritionally enhanced eggs from hens fed an omega-3 rich diet. Great for heart health and brain development.",
          Vs(V("6 pcs", 89, null, 60), V("12 pcs", 169, 179, 40)),
          As(A("Type","Omega-3 Eggs"), A("Size","Large")),
          Tags("eggs","omega3","healthy","nutrition"),
          Imgs("724","725","726")),

        P(cat, "Rohu Fish", "rohu-fish",
          "Freshwater rohu fish, a staple in Indian and Bengali cooking. Cleaned and cut into ready-to-cook pieces.",
          Vs(V("500g", 199, null, 50), V("1kg", 379, 399, 30)),
          As(A("Type","Freshwater Fish"), A("Origin","India")),
          Tags("fish","rohu","curry","bengali"),
          Imgs("727","728","729")),

        P(cat, "Pomfret Fish", "pomfret-fish",
          "Popular silver pomfret, ideal for shallow frying or curries. Delicate white flesh with mild taste.",
          Vs(V("2 pcs (400g)", 299, null, 30), V("4 pcs (800g)", 559, 599, 20)),
          As(A("Type","Saltwater Fish"), A("Origin","Indian Ocean")),
          Tags("fish","pomfret","fry","goan"),
          Imgs("730","731","732")),

        P(cat, "Surmai (King Fish)", "surmai-king-fish",
          "Premium surmai with firm flesh, a Maharashtrian favourite for frying and curries. Low in fat and high in protein.",
          Vs(V("500g", 349, null, 30), V("1kg", 679, 729, 15)),
          As(A("Type","King Fish"), A("Origin","Arabian Sea")),
          Tags("fish","surmai","kingfish","maharashtrian"),
          Imgs("733","734","735")),

        P(cat, "Salmon Fillet", "salmon-fillet",
          "Atlantic salmon fillet rich in omega-3 fatty acids and Vitamin D. Perfect for grilling, baking or pan-searing.",
          Vs(V("200g", 399, null, 30), V("400g", 749, 799, 15)),
          As(A("Type","Salmon Fillet"), A("Origin","Norway"), A("Storage","Refrigerate")),
          Tags("salmon","fish","omega3","healthy"),
          Imgs("736","737","738")),

        P(cat, "Prawns Medium", "prawns-medium",
          "Fresh medium-sized prawns, deveined and shell-on for maximum flavour. Great for masala, stir-fry and biryani.",
          Vs(V("250g", 199, null, 40), V("500g", 379, 399, 25)),
          As(A("Type","Medium Prawns"), A("Storage","Refrigerate")),
          Tags("prawns","shrimp","seafood","curry"),
          Imgs("739","740","741")),

        P(cat, "Tiger Prawns Large", "tiger-prawns-large",
          "Jumbo tiger prawns, ideal for BBQ, butter garlic or coconut curry. Meaty and succulent.",
          Vs(V("250g", 299, null, 30), V("500g", 569, 599, 15)),
          As(A("Type","Tiger Prawns"), A("Storage","Refrigerate")),
          Tags("prawns","tiger","seafood","bbq"),
          Imgs("742","743","744")),

        P(cat, "Crab Cleaned", "crab-cleaned",
          "Fresh blue swimmer crab, cleaned and ready to cook. A delicacy for spicy crab masala and coastal curries.",
          Vs(V("500g", 349, null, 20)),
          As(A("Type","Blue Swimmer Crab"), A("Storage","Cook same day")),
          Tags("crab","seafood","curry"),
          Imgs("745","746","747")),

        P(cat, "Squid Calamari", "squid-calamari",
          "Cleaned and ring-cut squid for frying or stir-frying. Tender and mild-flavoured, great with masala or in pasta.",
          Vs(V("250g", 189, null, 40), V("500g", 359, 379, 25)),
          As(A("Type","Squid Rings"), A("Storage","Refrigerate")),
          Tags("squid","calamari","seafood","fry"),
          Imgs("748","749","750")),

        P(cat, "Tilapia Fish", "tilapia-fish",
          "Mild-flavoured freshwater tilapia fillet, an affordable everyday fish. Boneless cuts ideal for curries and pan-frying.",
          Vs(V("500g", 179, null, 50), V("1kg", 339, 359, 30)),
          As(A("Type","Freshwater Fish"), A("Origin","India")),
          Tags("fish","tilapia","curry","fresh"),
          Imgs("751","752","753")),

        P(cat, "Mutton Curry Cut", "mutton-curry-cut",
          "Bone-in mutton pieces cut for slow-cooking curries and biryanis. Tender and flavourful with marbling fat.",
          Vs(V("250g", 299, null, 30), V("500g", 569, 609, 15)),
          As(A("Brand","Licious"), A("Type","Curry Cut"), A("Origin","India")),
          Tags("mutton","lamb","curry","non-veg"),
          Imgs("754","755","756")),

        P(cat, "Mutton Keema", "mutton-keema",
          "Freshly minced mutton ideal for keema matar, rolls and kebabs. Coarsely ground for a hearty texture.",
          Vs(V("250g", 279, null, 30), V("500g", 529, 569, 15)),
          As(A("Type","Minced Mutton"), A("Storage","Use within 24 hours")),
          Tags("mutton","keema","minced","non-veg"),
          Imgs("757","758","759")),

        P(cat, "Mutton Boneless", "mutton-boneless",
          "Premium boneless mutton cubes, perfect for Rogan Josh, bhuna or dum biryani. Trimmed and ready to marinate.",
          Vs(V("250g", 349, null, 25), V("500g", 669, 719, 12)),
          As(A("Type","Boneless"), A("Storage","Refrigerate")),
          Tags("mutton","boneless","biryani","non-veg"),
          Imgs("760","761","762")),

        P(cat, "Chicken Seekh Kebab", "chicken-seekh-kebab",
          "Pre-shaped chicken seekh kebabs seasoned with aromatic spices. Just grill or pan-fry for a quick snack.",
          Vs(V("4 pcs", 189, null, 50), V("8 pcs", 359, 379, 30)),
          As(A("Type","Ready to Cook"), A("Storage","Refrigerate")),
          Tags("kebab","readytocook","chicken","snack"),
          Imgs("763","764","765")),

        P(cat, "Fish Fingers", "fish-fingers",
          "Crispy-coated fish finger strips made from white fish fillets. A family favourite, ready in minutes.",
          Vs(V("200g", 149, null, 60), V("400g", 279, 299, 40)),
          As(A("Type","Ready to Cook"), A("Storage","Keep frozen")),
          Tags("fish","fingers","readytocook","snack"),
          Imgs("766","767","768")),

        P(cat, "Chicken Nuggets", "chicken-nuggets",
          "Golden breaded chicken nuggets made from real chicken breast meat. Kids love them — fry or bake in 10 minutes.",
          Vs(V("200g", 159, null, 60), V("400g", 299, 319, 40)),
          As(A("Type","Ready to Cook"), A("Storage","Keep frozen")),
          Tags("nuggets","chicken","readytocook","kids"),
          Imgs("769","770","771")),

        P(cat, "Pork Sausages", "pork-sausages",
          "Juicy pork sausages seasoned with herbs and spices for a classic breakfast fry-up. Pairs well with eggs and toast.",
          Vs(V("200g", 179, null, 40), V("400g", 339, 359, 25)),
          As(A("Type","Pork Sausage"), A("Storage","Refrigerate")),
          Tags("pork","sausage","breakfast","grill"),
          Imgs("772","773","774")),

        P(cat, "Chicken Salami", "chicken-salami",
          "Thinly sliced chicken salami, lightly spiced and ready to eat. Perfect for sandwiches and charcuterie boards.",
          Vs(V("100g", 89, null, 60), V("200g", 169, 179, 40)),
          As(A("Type","Deli Meat"), A("Storage","Refrigerate")),
          Tags("salami","chicken","sandwich","deli"),
          Imgs("775","776","777")),

        P(cat, "Tuna Canned", "tuna-canned",
          "Chunk tuna in springwater, ready to eat straight from the can. High protein, low fat — ideal for salads and sandwiches.",
          Vs(V("185g", 129, null, 80), V("3 x 185g", 359, 379, 40)),
          As(A("Type","Canned Tuna"), A("Storage","Room temperature")),
          Tags("tuna","canned","protein","sandwich"),
          Imgs("778","779","780")),

        P(cat, "Sardines Canned", "sardines-canned",
          "Sardines in oil packed with omega-3 and calcium. A quick protein-rich snack or rice accompaniment.",
          Vs(V("180g", 79, null, 80), V("3 x 180g", 219, 239, 40)),
          As(A("Type","Canned Sardines"), A("Storage","Room temperature")),
          Tags("sardines","canned","fish","snack"),
          Imgs("781","782","783")),
    ];

    private static List<Product> BuildPersonalCareProducts(Category cat) =>
    [
        P(cat, "Dove Shampoo Intense Repair", "dove-shampoo-intense-repair",
          "Dove's Intense Repair shampoo with Keratin Actives restores damaged hair to its best. Leaves hair soft, smooth and 10x stronger.",
          Vs(V("180ml", 199, 219, 60), V("340ml", 349, 375, 40)),
          As(A("Brand","Dove"), A("Hair Type","Damaged"), A("For","All Hair Types")),
          Tags("shampoo","dove","haircare","repair"),
          Imgs("800","801","802")),

        P(cat, "Head & Shoulders Anti-Dandruff Shampoo", "head-shoulders-anti-dandruff",
          "Clinically proven anti-dandruff shampoo that removes flakes and keeps scalp healthy. Gentle enough for daily use.",
          Vs(V("180ml", 219, 239, 60), V("340ml", 379, 399, 40)),
          As(A("Brand","Head & Shoulders"), A("Type","Anti-Dandruff")),
          Tags("shampoo","anti-dandruff","headshoulders","scalp"),
          Imgs("803","804","805")),

        P(cat, "Pantene Smooth & Silky Shampoo", "pantene-smooth-silky-shampoo",
          "Pantene's Pro-V formula delivers salon-smooth hair with each wash. Reduces frizz and adds brilliant shine.",
          Vs(V("180ml", 199, 219, 60), V("340ml", 349, 375, 40)),
          As(A("Brand","Pantene"), A("Hair Type","All"), A("Benefit","Smoothness")),
          Tags("shampoo","pantene","smooth","silky"),
          Imgs("806","807","808")),

        P(cat, "Clinic Plus Shampoo", "clinic-plus-shampoo",
          "India's most trusted family shampoo with milk proteins and vitamins. Strengthens hair from root to tip.",
          Vs(V("175ml", 99, null, 100), V("340ml", 179, 199, 60)),
          As(A("Brand","Clinic Plus"), A("Hair Type","All"), A("Key Ingredient","Milk Protein")),
          Tags("shampoo","clinicplus","affordable","family"),
          Imgs("809","810","811")),

        P(cat, "Dove Conditioner", "dove-conditioner",
          "Dove Intense Repair Conditioner instantly detangles and nourishes damaged hair. Use after shampooing for noticeably softer hair.",
          Vs(V("180ml", 199, 219, 60), V("335ml", 329, 349, 40)),
          As(A("Brand","Dove"), A("Type","Conditioner"), A("Hair Type","Damaged")),
          Tags("conditioner","dove","haircare","detangle"),
          Imgs("812","813","814")),

        P(cat, "Mamaearth Onion Hair Oil", "mamaearth-onion-hair-oil",
          "Onion oil infused with Redensyl reduces hair fall and promotes regrowth. Free from mineral oil and paraben.",
          Vs(V("150ml", 249, 269, 50), V("250ml", 379, 399, 30)),
          As(A("Brand","Mamaearth"), A("Key Ingredient","Onion Oil"), A("Free From","Mineral Oil, Paraben")),
          Tags("hairoil","onion","mamaearth","hairfall"),
          Imgs("815","816","817")),

        P(cat, "Parachute Coconut Oil", "parachute-coconut-oil",
          "Pure refined coconut oil for hair and skin care, India's most iconic hair oil. Strengthens hair, reduces breakage and adds shine.",
          Vs(V("100ml", 79, null, 100), V("200ml", 139, null, 80), V("500ml", 299, 319, 50)),
          As(A("Brand","Parachute"), A("Type","Coconut Oil"), A("Purity","100% Pure")),
          Tags("coconutoil","parachute","hairoil","classic"),
          Imgs("818","819","820")),

        P(cat, "Dove Beauty Soap", "dove-beauty-soap",
          "Dove Beauty Bar with ¼ moisturising cream leaves skin softer and smoother after every wash. Gentle enough for daily use.",
          Vs(V("75g", 45, null, 150), V("3×75g", 129, 139, 80)),
          As(A("Brand","Dove"), A("Type","Moisturising Bar"), A("Skin Type","All")),
          Tags("soap","dove","moisturizing","skin"),
          Imgs("821","822","823")),

        P(cat, "Dettol Original Soap", "dettol-original-soap",
          "Dettol's antibacterial bar soap provides 100x better germ protection than ordinary soap. Trusted by doctors.",
          Vs(V("75g", 42, null, 150), V("3×75g", 119, 129, 80)),
          As(A("Brand","Dettol"), A("Type","Antibacterial Bar"), A("Protection","Germ Protection")),
          Tags("soap","dettol","antibacterial","germ"),
          Imgs("824","825","826")),

        P(cat, "Nivea Body Lotion", "nivea-body-lotion",
          "Nivea Express Hydration body lotion absorbs instantly and provides long-lasting moisturisation. Non-greasy formula with aloe vera.",
          Vs(V("200ml", 199, 219, 60), V("400ml", 349, 375, 40)),
          As(A("Brand","Nivea"), A("Skin Type","Normal"), A("Key Ingredient","Aloe Vera")),
          Tags("bodylotion","nivea","moisturizer","skin"),
          Imgs("827","828","829")),

        P(cat, "Cetaphil Moisturizing Cream", "cetaphil-moisturizing-cream",
          "Dermatologist-recommended Cetaphil cream for very dry and sensitive skin. Clinically proven to hydrate for 48 hours.",
          Vs(V("80g", 299, 329, 40), V("250g", 699, 749, 20)),
          As(A("Brand","Cetaphil"), A("Skin Type","Sensitive/Dry"), A("Free From","Parabens")),
          Tags("cetaphil","moisturizer","sensitive","derma"),
          Imgs("830","831","832")),

        P(cat, "Vaseline Petroleum Jelly", "vaseline-petroleum-jelly",
          "Original Vaseline jelly forms a protective barrier to lock in moisture and heal dry skin. Dermatologist approved.",
          Vs(V("50ml", 89, null, 80), V("100ml", 149, 159, 60)),
          As(A("Brand","Vaseline"), A("Type","Petroleum Jelly"), A("Skin Type","All")),
          Tags("vaseline","petroleum","moisturizer","lips"),
          Imgs("833","834","835")),

        P(cat, "Himalaya Purifying Neem Face Wash", "himalaya-neem-face-wash",
          "Himalaya's neem and turmeric face wash deeply cleanses and fights bacteria causing pimples. Gentle and soap-free.",
          Vs(V("50ml", 79, null, 100), V("100ml", 139, 149, 70)),
          As(A("Brand","Himalaya"), A("Key Ingredients","Neem, Turmeric"), A("Type","Face Wash")),
          Tags("facewash","himalaya","neem","purifying"),
          Imgs("836","837","838")),

        P(cat, "Neutrogena Sunscreen SPF50", "neutrogena-sunscreen-spf50",
          "Lightweight Neutrogena Ultra Sheer sunscreen with SPF50+ PA+++ provides broad-spectrum UVA/UVB protection. Non-sticky finish.",
          Vs(V("30ml", 299, 329, 40), V("88ml", 699, 749, 20)),
          As(A("Brand","Neutrogena"), A("SPF","50+"), A("Water Resistant","Yes")),
          Tags("sunscreen","spf50","neutrogena","uv"),
          Imgs("839","840","841")),

        P(cat, "Colgate Strong Teeth Toothpaste", "colgate-strong-teeth-toothpaste",
          "Colgate Strong Teeth with Amino Cal strengthens enamel and prevents cavities. India's most trusted toothpaste.",
          Vs(V("200g", 89, null, 150), V("300g", 129, 139, 100)),
          As(A("Brand","Colgate"), A("Key Benefit","Cavity Protection"), A("Fluoride","Yes")),
          Tags("toothpaste","colgate","calcium","cavity"),
          Imgs("842","843","844")),

        P(cat, "Pepsodent Toothpaste", "pepsodent-toothpaste",
          "Pepsodent Germi-Check toothpaste with zinc citrate fights germs and keeps breath fresh all day. Clinically tested.",
          Vs(V("150g", 79, null, 100), V("300g", 139, 149, 70)),
          As(A("Brand","Pepsodent"), A("Key Benefit","Germ Protection")),
          Tags("toothpaste","pepsodent","germ","protection"),
          Imgs("845","846","847")),

        P(cat, "Oral-B Toothbrush Medium", "oral-b-toothbrush-medium",
          "Oral-B CrossAction toothbrush with angled bristles removes up to 100% more plaque versus a regular flat-trim brush.",
          Vs(V("1 pc", 49, null, 150), V("3 pcs", 129, 139, 80)),
          As(A("Brand","Oral-B"), A("Bristle","Medium"), A("Head Design","CrossAction")),
          Tags("toothbrush","oralb","medium","plaque"),
          Imgs("848","849","850")),

        P(cat, "Listerine Cool Mint Mouthwash", "listerine-cool-mint-mouthwash",
          "Listerine antiseptic mouthwash kills 99.9% of germs in 30 seconds. Provides 12-hour protection and fresher breath.",
          Vs(V("250ml", 149, 169, 60), V("500ml", 249, 279, 40)),
          As(A("Brand","Listerine"), A("Flavour","Cool Mint"), A("Action","Antiseptic")),
          Tags("mouthwash","listerine","fresh","minty"),
          Imgs("851","852","853")),

        P(cat, "Dove Deo Roll-On Women", "dove-deo-roll-on-women",
          "Dove roll-on deodorant offers 48-hour protection with a ¼ moisturising care formula. Gentle on underarm skin.",
          Vs(V("40ml", 149, 169, 60), V("2×40ml", 279, 299, 40)),
          As(A("Brand","Dove"), A("Type","Roll-On"), A("For","Women")),
          Tags("deodorant","dove","rollOn","women"),
          Imgs("854","855","856")),

        P(cat, "Axe Deo Spray Men", "axe-deo-spray-men",
          "Axe Dark Temptation body spray with anti-perspirant action keeps you fresh for 48 hours. Irresistible chocolate-cedar fragrance.",
          Vs(V("150ml", 199, 219, 60), V("2×150ml", 369, 399, 30)),
          As(A("Brand","Axe"), A("Type","Body Spray"), A("For","Men")),
          Tags("deodorant","axe","spray","men"),
          Imgs("857","858","859")),

        P(cat, "Gillette Mach3 Razor", "gillette-mach3-razor",
          "Gillette Mach3 with 3 DuraComfort blades gives a close, comfortable shave with less irritation. Pivoting head follows face contours.",
          Vs(V("1 razor", 199, 219, 50), V("1 razor + 2 cartridges", 349, 379, 30)),
          As(A("Brand","Gillette"), A("Blades","3"), A("Type","Cartridge Razor")),
          Tags("razor","gillette","mach3","shaving"),
          Imgs("860","861","862")),

        P(cat, "Gillette Shaving Foam", "gillette-shaving-foam",
          "Gillette Series Sensitive shaving foam moisturises skin as you shave for a smooth, nick-free shave. Dermatologist tested.",
          Vs(V("175g", 179, 199, 50), V("418g", 349, 379, 30)),
          As(A("Brand","Gillette"), A("Type","Shaving Foam"), A("Skin Type","Sensitive")),
          Tags("shavingfoam","gillette","sensitive","smooth"),
          Imgs("863","864","865")),

        P(cat, "Whisper Ultra Pads", "whisper-ultra-pads",
          "Whisper Ultra with Wings provides leak-lock protection on heavy days. Super thin and comfortable for all-day freshness.",
          Vs(V("7 pcs", 59, null, 100), V("15 pcs", 119, 129, 70), V("30 pcs", 219, 239, 40)),
          As(A("Brand","Whisper"), A("Type","Sanitary Pads"), A("Wings","Yes")),
          Tags("pads","whisper","feminine","ultra"),
          Imgs("866","867","868")),

        P(cat, "Stayfree Secure Pads", "stayfree-secure-pads",
          "Stayfree Secure XL pads with cottony soft cover and fluid lock gel keep you dry and comfortable. Wide back prevents leaks.",
          Vs(V("8 pcs", 55, null, 100), V("18 pcs", 115, 125, 60)),
          As(A("Brand","Stayfree"), A("Type","Sanitary Pads"), A("Size","XL")),
          Tags("pads","stayfree","secure","feminine"),
          Imgs("869","870","871")),

        P(cat, "Sofy Anti-Bacterial Pads", "sofy-anti-bacterial-pads",
          "Sofy Antibacterial pads kill 99.9% bacteria with an anti-bacterial layer, keeping you infection-free. Ultra thin and flexible.",
          Vs(V("8 pcs", 79, null, 80), V("18 pcs", 159, 169, 50)),
          As(A("Brand","Sofy"), A("Type","Anti-Bacterial Pads")),
          Tags("pads","sofy","antibacterial","feminine"),
          Imgs("872","873","874")),

        P(cat, "Johnson's Baby Powder", "johnsons-baby-powder-adults",
          "Johnson's pure talc powder keeps skin fresh, dry and fragrant all day. Gentle enough for adults and babies.",
          Vs(V("100g", 89, null, 100), V("300g", 219, 239, 60)),
          As(A("Brand","Johnson's"), A("Type","Talc Powder"), A("Fragrance","Fresh")),
          Tags("powder","johnsons","talc","fresh"),
          Imgs("875","876","877")),

        P(cat, "Dettol Handwash", "dettol-handwash",
          "Dettol Original liquid handwash kills 99.9% bacteria and viruses in 20 seconds. Moisturising formula prevents skin dryness.",
          Vs(V("200ml", 89, null, 100), V("500ml", 179, 199, 60)),
          As(A("Brand","Dettol"), A("Type","Liquid Handwash"), A("Action","Antibacterial")),
          Tags("handwash","dettol","antibacterial","pump"),
          Imgs("878","879","880")),

        P(cat, "Savlon Handwash", "savlon-handwash",
          "Savlon Moisturising Germ Protection handwash with aloe vera keeps hands germ-free and soft. Dermatologist recommended.",
          Vs(V("200ml", 79, null, 100), V("500ml", 159, 169, 60)),
          As(A("Brand","Savlon"), A("Type","Liquid Handwash"), A("Key Ingredient","Aloe Vera")),
          Tags("handwash","savlon","antiseptic","germ"),
          Imgs("881","882","883")),
    ];

    private static List<Product> BuildHouseholdProducts(Category cat) =>
    [
        P(cat, "Ariel Matic Detergent Powder", "ariel-matic-detergent-powder",
          "Ariel Matic with ActiveOxygen formula lifts tough stains in the first wash. Specially designed for front-load washing machines.",
          Vs(V("1kg", 249, 269, 60), V("2kg", 459, 499, 40), V("4kg", 879, 949, 20)),
          As(A("Brand","Ariel"), A("Type","Front Load"), A("Fragrance","Fresh")),
          Tags("detergent","ariel","matic","laundry"),
          Imgs("900","901","902")),

        P(cat, "Surf Excel Easy Wash", "surf-excel-easy-wash",
          "Surf Excel's Active Shine formula removes even dried stains with minimum effort. Economical and suitable for hand-wash.",
          Vs(V("500g", 129, null, 80), V("1kg", 239, 259, 60), V("2kg", 449, 479, 30)),
          As(A("Brand","Surf Excel"), A("Type","Hand Wash"), A("Key Benefit","Stain Removal")),
          Tags("detergent","surfexcel","handwash","laundry"),
          Imgs("903","904","905")),

        P(cat, "Tide Plus Detergent", "tide-plus-detergent",
          "Tide Plus Extra Power gives the whitest whites with anti-yellowing technology. Effective in hard water too.",
          Vs(V("500g", 99, null, 100), V("1kg", 189, 199, 70), V("2kg", 359, 379, 40)),
          As(A("Brand","Tide"), A("Key Benefit","Whitening"), A("Type","Detergent Powder")),
          Tags("detergent","tide","laundry","whitening"),
          Imgs("906","907","908")),

        P(cat, "Comfort Fabric Conditioner", "comfort-fabric-conditioner",
          "Comfort Lily Fresh fabric conditioner makes clothes feel softer and smell fresh for up to 7 days. Reduces static and ironing time.",
          Vs(V("220ml", 89, null, 80), V("860ml", 299, 329, 40)),
          As(A("Brand","Comfort"), A("Fragrance","Lily"), A("Type","Fabric Conditioner")),
          Tags("fabricconditioner","comfort","softener","fresh"),
          Imgs("909","910","911")),

        P(cat, "Vim Dishwash Bar", "vim-dishwash-bar",
          "Vim bar with active salt removes tough grease and leaves dishes sparkling clean. Long-lasting bar that lasts 2x more.",
          Vs(V("200g", 35, null, 200), V("400g", 65, null, 150), V("3×200g", 99, 109, 80)),
          As(A("Brand","Vim"), A("Type","Dishwash Bar"), A("Key Ingredient","Active Salt")),
          Tags("dishwash","vim","bar","kitchen"),
          Imgs("912","913","914")),

        P(cat, "Pril Dishwash Liquid", "pril-dishwash-liquid",
          "Pril lemon dishwash liquid cuts through grease in seconds and leaves dishes squeaky clean. Gentle on hands.",
          Vs(V("500ml", 129, 139, 60), V("1L", 219, 239, 40)),
          As(A("Brand","Pril"), A("Fragrance","Lemon"), A("Type","Liquid")),
          Tags("dishwash","pril","liquid","lemon"),
          Imgs("915","916","917")),

        P(cat, "Lizol Floor Cleaner Citrus", "lizol-floor-cleaner-citrus",
          "Lizol citrus floor cleaner kills 99.9% germs including Coronavirus on floors. Leaves a fresh citrus fragrance.",
          Vs(V("500ml", 119, 129, 80), V("975ml", 199, 219, 50), V("1.8L", 349, 379, 25)),
          As(A("Brand","Lizol"), A("Fragrance","Citrus"), A("Disinfectant","Yes")),
          Tags("floorcleaner","lizol","citrus","disinfectant"),
          Imgs("918","919","920")),

        P(cat, "Colin Glass Cleaner", "colin-glass-cleaner",
          "Colin glass and surface cleaner with Crystal Clear technology leaves mirrors, tiles and glass streak-free and shiny.",
          Vs(V("250ml", 89, null, 80), V("500ml", 149, 159, 50)),
          As(A("Brand","Colin"), A("Type","Glass Cleaner"), A("Surface","Glass, Tiles, Mirrors")),
          Tags("glasscleaner","colin","surface","shine"),
          Imgs("921","922","923")),

        P(cat, "Harpic Toilet Cleaner", "harpic-toilet-cleaner",
          "Harpic Power Plus 10x more power than ordinary cleaners removes limescale, stains and kills germs under the rim. Thick formula that clings.",
          Vs(V("500ml", 119, 129, 70), V("1L", 199, 219, 40)),
          As(A("Brand","Harpic"), A("Type","Toilet Cleaner"), A("Key Benefit","Limescale Removal")),
          Tags("toiletcleaner","harpic","bathroom","germ"),
          Imgs("924","925","926")),

        P(cat, "Domex Toilet Cleaner", "domex-toilet-cleaner",
          "Domex bleach-based toilet cleaner kills all known germs and leaves toilet bowl visibly cleaner and whiter. Thick gel formula.",
          Vs(V("500ml", 109, null, 70), V("1L", 189, 199, 40)),
          As(A("Brand","Domex"), A("Type","Bleach Gel"), A("Action","Germ Kill")),
          Tags("toiletcleaner","domex","bleach","hygiene"),
          Imgs("927","928","929")),

        P(cat, "Mortein All Insect Killer Spray", "mortein-all-insect-killer-spray",
          "Mortein Instant Kill spray kills mosquitoes, cockroaches and flies on contact. Fast-acting formula lasts up to 12 hours.",
          Vs(V("425ml", 199, 219, 50), V("625ml", 269, 289, 30)),
          As(A("Brand","Mortein"), A("Type","Insecticide Spray"), A("Kills","Mosquitoes, Cockroaches, Flies")),
          Tags("pestcontrol","mortein","mosquito","insect"),
          Imgs("930","931","932")),

        P(cat, "Good Knight Fast Card", "good-knight-fast-card",
          "Good Knight Fast Card repels mosquitoes using natural actives activated by a flame, with no electricity needed. Lasts 4 hours.",
          Vs(V("10 cards", 49, null, 100), V("30 cards", 129, 139, 60)),
          As(A("Brand","Good Knight"), A("Type","Mosquito Repellent Card"), A("Duration","4 hours/card")),
          Tags("mosquito","goodknight","fastcard","night"),
          Imgs("933","934","935")),

        P(cat, "Hit Mosquito & Fly Killer", "hit-mosquito-fly-killer",
          "Hit Flying Insect Killer spray provides fast knock-down action against mosquitoes, flies and other flying insects. Safe for indoor use.",
          Vs(V("400ml", 149, 159, 60), V("625ml", 219, 239, 40)),
          As(A("Brand","Hit"), A("Type","Aerosol Spray"), A("Action","Contact Kill")),
          Tags("mosquito","hit","fly","killer"),
          Imgs("936","937","938")),

        P(cat, "Ziplock Bags Medium", "ziplock-bags-medium",
          "Resealable ziplock bags keep food fresh, dry and organised in the fridge or pantry. BPA-free and reusable.",
          Vs(V("15 pcs", 89, null, 80), V("30 pcs", 159, 169, 50)),
          As(A("Type","Resealable Bags"), A("Size","Medium"), A("BPA Free","Yes")),
          Tags("ziplock","storage","kitchen","freshness"),
          Imgs("939","940","941")),

        P(cat, "Aluminium Foil", "aluminium-foil",
          "Heavy-duty aluminium foil for wrapping, baking and storing food. Prevents freezer burn and retains moisture.",
          Vs(V("9m", 79, null, 80), V("21m", 149, 159, 50)),
          As(A("Type","Aluminium Foil"), A("Thickness","18 micron")),
          Tags("aluminiumfoil","kitchen","baking","wrap"),
          Imgs("942","943","944")),

        P(cat, "Garbage Bags", "garbage-bags",
          "Heavy-duty garbage bags with strong handles, tear-resistant and leak-proof. Fits standard dustbins.",
          Vs(V("30 pcs Small", 89, null, 100), V("30 pcs Large", 119, 129, 80)),
          As(A("Type","Garbage Bag"), A("Material","LDPE")),
          Tags("garbagebag","trash","waste","dustbin"),
          Imgs("945","946","947")),

        P(cat, "Tissue Paper", "tissue-paper",
          "Soft 2-ply tissue paper for everyday cleaning, wiping and blotting. Gentle on skin and highly absorbent.",
          Vs(V("100 pulls", 79, null, 100), V("200 pulls", 139, 149, 60)),
          As(A("Type","Facial Tissue"), A("Ply","2")),
          Tags("tissue","paper","cleaning","soft"),
          Imgs("948","949","950")),

        P(cat, "Odonil Air Freshener", "odonil-air-freshener",
          "Odonil Room Freshener with Lavender Mist fragrance keeps rooms smelling fresh for up to 30 days. No spraying needed.",
          Vs(V("75g", 89, null, 80), V("2×75g", 159, 169, 50)),
          As(A("Brand","Odonil"), A("Fragrance","Lavender"), A("Lasts","30 days")),
          Tags("airfreshener","odonil","lavender","fragrance"),
          Imgs("951","952","953")),

        P(cat, "Air Wick Freshmatic", "air-wick-freshmatic",
          "Air Wick Freshmatic automatic air freshener sprays bursts of fragrance every 9, 18 or 36 minutes. Keeps home fresh around the clock.",
          Vs(V("Refill 250ml", 299, 329, 30), V("Starter Kit", 499, 549, 15)),
          As(A("Brand","Air Wick"), A("Type","Automatic Spray"), A("Fragrance","Morning Dew")),
          Tags("airwick","freshmatic","automatic","fragrance"),
          Imgs("954","955","956")),

        P(cat, "Ambi Pur Car Freshener", "ambi-pur-car-freshener",
          "Ambi Pur car air freshener continuously releases fragrance to neutralise even the toughest car odours. Lasts up to 45 days.",
          Vs(V("1 pc", 149, 159, 60), V("2 pcs", 269, 289, 30)),
          As(A("Brand","Ambi Pur"), A("Fragrance","Ocean"), A("Duration","45 days")),
          Tags("carfreshener","ambipur","ocean","fragrance"),
          Imgs("957","958","959")),

        P(cat, "Syska LED Bulb 9W", "syska-led-bulb-9w",
          "Syska 9W LED bulb provides bright, energy-efficient light equivalent to 70W incandescent bulbs. 2-year warranty.",
          Vs(V("1 pc", 89, null, 80), V("2 pcs", 169, 179, 50)),
          As(A("Brand","Syska"), A("Wattage","9W"), A("Base","B22"), A("Warranty","2 years")),
          Tags("ledbulb","syska","9w","energy"),
          Imgs("960","961","962")),

        P(cat, "Havells LED Bulb 12W", "havells-led-bulb-12w",
          "Havells Adore 12W LED bulb offers high brightness of 1200 lumens with a cool daylight colour. Energy-saving and long-lasting.",
          Vs(V("1 pc", 109, null, 70), V("2 pcs", 199, 219, 40)),
          As(A("Brand","Havells"), A("Wattage","12W"), A("Colour","Cool Daylight"), A("Lumens","1200")),
          Tags("ledbulb","havells","12w","bright"),
          Imgs("963","964","965")),

        P(cat, "Duracell AA Batteries", "duracell-aa-batteries",
          "Duracell Optimum AA batteries provide long-lasting power for remotes, clocks and toys. Leak-proof and up to 100% extra life.",
          Vs(V("2 pcs", 89, null, 80), V("4 pcs", 159, 169, 50)),
          As(A("Brand","Duracell"), A("Type","AA Alkaline"), A("Leak Proof","Yes")),
          Tags("batteries","duracell","aa","alkaline"),
          Imgs("966","967","968")),

        P(cat, "Energizer AAA Batteries", "energizer-aaa-batteries",
          "Energizer Max AAA batteries hold power for up to 10 years in storage. Powers small devices reliably.",
          Vs(V("2 pcs", 79, null, 80), V("4 pcs", 139, 149, 50)),
          As(A("Brand","Energizer"), A("Type","AAA Alkaline"), A("Shelf Life","10 years")),
          Tags("batteries","energizer","aaa","alkaline"),
          Imgs("969","970","971")),

        P(cat, "Scotch-Brite Scrub Pad", "scotch-brite-scrub-pad",
          "Scotch-Brite heavy-duty scrub pad removes tough burnt and baked-on food easily. Durable fibres last long and resist odour.",
          Vs(V("1 pc", 35, null, 200), V("3 pcs", 99, 109, 100)),
          As(A("Brand","Scotch-Brite"), A("Type","Scrub Pad"), A("Heavy Duty","Yes")),
          Tags("scrubpad","scotchbrite","kitchen","cleaning"),
          Imgs("972","973","974")),

        P(cat, "Mop Refill", "mop-refill",
          "Microfibre mop refill with high absorbency for streak-free floor cleaning. Fits most standard floor mop handles.",
          Vs(V("1 pc", 149, null, 60), V("2 pcs", 279, 299, 30)),
          As(A("Type","Microfibre Mop Refill"), A("Compatible","Standard Handles")),
          Tags("mop","refill","floor","cleaning"),
          Imgs("975","976","977")),

        P(cat, "Candles", "candles",
          "Long-burning paraffin wax candles for home décor, emergencies and power cuts. Dripless and odour-free.",
          Vs(V("6 pcs", 49, null, 100), V("12 pcs", 89, 99, 60)),
          As(A("Type","Paraffin Wax Candle"), A("Burn Time","~4 hours each")),
          Tags("candles","light","emergency","wax"),
          Imgs("978","979","980")),

        P(cat, "Matchbox", "matchbox",
          "Safety matchbox with easy strike-on-box matches for kitchen and household use. Each match lights reliably every time.",
          Vs(V("10 pcs", 25, null, 200), V("50 pcs", 99, 109, 80)),
          As(A("Type","Safety Matches"), A("Sticks per box","~40")),
          Tags("matchbox","fire","kitchen","lighter"),
          Imgs("981","982","983")),
    ];

    private static List<Product> BuildBabyCareProducts(Category cat) =>
    [
        P(cat, "Pampers Active Baby Diapers S", "pampers-active-baby-diapers-s",
          "Pampers Active Baby diapers with 3D channels quickly absorb wetness and keep baby dry for up to 12 hours. Super soft cottony feel.",
          Vs(V("20 pcs", 349, 379, 40), V("40 pcs", 649, 699, 20)),
          As(A("Brand","Pampers"), A("Size","S (4-8 kg)"), A("Type","Taped Diaper")),
          Tags("diapers","pampers","newborn","soft"),
          Imgs("1000","1001","1002")),

        P(cat, "Pampers Active Baby Diapers M", "pampers-active-baby-diapers-m",
          "Pampers Active Baby M size with 3D channels for baby who's active and rolling around. 12-hour dryness protection.",
          Vs(V("18 pcs", 349, 379, 40), V("36 pcs", 649, 699, 20)),
          As(A("Brand","Pampers"), A("Size","M (7-12 kg)"), A("Type","Taped Diaper")),
          Tags("diapers","pampers","medium","baby"),
          Imgs("1003","1004","1005")),

        P(cat, "Pampers Active Baby Diapers L", "pampers-active-baby-diapers-l",
          "Pampers Active Baby L size designed for bigger, more active babies with superior leak protection. Stretchy sides for a secure fit.",
          Vs(V("16 pcs", 349, 379, 40), V("32 pcs", 649, 699, 20)),
          As(A("Brand","Pampers"), A("Size","L (9-14 kg)"), A("Type","Taped Diaper")),
          Tags("diapers","pampers","large","toddler"),
          Imgs("1006","1007","1008")),

        P(cat, "Huggies Wonder Pants M", "huggies-wonder-pants-m",
          "Huggies Wonder Pants with 360° Soft Stretch waistband provide leak protection without restricting baby's movements. Pull-up style for easy changes.",
          Vs(V("24 pcs", 399, 429, 35), V("42 pcs", 679, 729, 18)),
          As(A("Brand","Huggies"), A("Size","M (7-12 kg)"), A("Type","Pants")),
          Tags("diapers","huggies","pants","pullup"),
          Imgs("1009","1010","1011")),

        P(cat, "Huggies Wonder Pants L", "huggies-wonder-pants-l",
          "Huggies Wonder Pants L with breathable fabric and 360° stretch for active toddlers. Double leak guards keep clothes dry.",
          Vs(V("22 pcs", 399, 429, 30), V("40 pcs", 679, 729, 15)),
          As(A("Brand","Huggies"), A("Size","L (9-14 kg)"), A("Type","Pants")),
          Tags("diapers","huggies","pants","large"),
          Imgs("1012","1013","1014")),

        P(cat, "MamyPoko Pants XL", "mamypoko-pants-xl",
          "MamyPoko Pants XL with a Japanese technology leak barrier sheet and no sag guarantee for bigger babies. Easy pull-up design.",
          Vs(V("20 pcs", 379, 409, 30), V("40 pcs", 699, 749, 15)),
          As(A("Brand","MamyPoko"), A("Size","XL (12-17 kg)"), A("Type","Pants")),
          Tags("diapers","mamypoko","pants","xl"),
          Imgs("1015","1016","1017")),

        P(cat, "Johnson's Baby Shampoo", "johnsons-baby-shampoo",
          "Johnson's No More Tears formula is as gentle to eyes as pure water. Dermatologist tested and hypoallergenic for babies from birth.",
          Vs(V("100ml", 129, 139, 70), V("200ml", 219, 239, 45)),
          As(A("Brand","Johnson's"), A("For","0+ years"), A("Tear Free","Yes")),
          Tags("babyshampoo","johnsons","tearfree","gentle"),
          Imgs("1018","1019","1020")),

        P(cat, "Johnson's Baby Soap", "johnsons-baby-soap",
          "Johnson's baby soap with a mild, pure formula nourishes and protects delicate newborn skin. Dermatologist and paediatrician tested.",
          Vs(V("75g", 59, null, 100), V("3×75g", 159, 169, 60)),
          As(A("Brand","Johnson's"), A("For","Babies"), A("Skin Type","Sensitive")),
          Tags("babysoap","johnsons","gentle","mild"),
          Imgs("1021","1022","1023")),

        P(cat, "Johnson's Baby Lotion", "johnsons-baby-lotion",
          "Johnson's baby lotion with COTTONTOUCH technology is mild and gentle on baby's soft skin. Provides 24-hour moisturisation.",
          Vs(V("100ml", 149, 159, 70), V("200ml", 249, 269, 40)),
          As(A("Brand","Johnson's"), A("Moisturisation","24 hour"), A("Technology","COTTONTOUCH")),
          Tags("babylotion","johnsons","moisturizer","soft"),
          Imgs("1024","1025","1026")),

        P(cat, "Himalaya Baby Cream", "himalaya-baby-cream",
          "Himalaya herbal baby cream with olive oil and country mallow keeps baby's skin soft and moisturised. No parabens, no mineral oil.",
          Vs(V("50g", 89, null, 80), V("100g", 149, 159, 50)),
          As(A("Brand","Himalaya"), A("Key Ingredients","Olive Oil, Country Mallow"), A("Free From","Paraben")),
          Tags("babycream","himalaya","moisturizer","gentle"),
          Imgs("1027","1028","1029")),

        P(cat, "Sebamed Baby Wash", "sebamed-baby-wash",
          "Sebamed Baby Wash with pH 5.5 maintains the natural protective acid mantle of baby's skin. Soap-free and allergy-tested.",
          Vs(V("200ml", 299, 329, 30), V("400ml", 549, 589, 15)),
          As(A("Brand","Sebamed"), A("pH","5.5"), A("Soap Free","Yes")),
          Tags("babywash","sebamed","ph","sensitive"),
          Imgs("1030","1031","1032")),

        P(cat, "WOW Baby Shampoo & Body Wash", "wow-baby-shampoo",
          "WOW Skin Science 2-in-1 baby shampoo and body wash made from natural plant-based ingredients. Sulphate-free and tearless.",
          Vs(V("200ml", 249, 269, 40), V("400ml", 449, 479, 20)),
          As(A("Brand","WOW"), A("Type","2-in-1"), A("Sulphate Free","Yes")),
          Tags("babyshampoo","wow","natural","sulfatefree"),
          Imgs("1033","1034","1035")),

        P(cat, "Nestle Cerelac Stage 1 Wheat", "nestle-cerelac-stage-1-wheat",
          "Nestle Cerelac wheat and milk Stage 1 is fortified with 18 key nutrients for babies from 6 months. Easy to digest.",
          Vs(V("300g", 249, 269, 40), V("1kg", 749, 799, 20)),
          As(A("Brand","Nestle"), A("Stage","1 (6 months+)"), A("Flavour","Wheat")),
          Tags("babyfood","cerelac","nestle","wheat"),
          Imgs("1036","1037","1038")),

        P(cat, "Nestle Cerelac Stage 2 Rice", "nestle-cerelac-stage-2-rice",
          "Nestle Cerelac rice and milk Stage 2 introduces textured food for babies from 8 months. Iron and vitamin enriched.",
          Vs(V("300g", 249, 269, 40), V("1kg", 749, 799, 20)),
          As(A("Brand","Nestle"), A("Stage","2 (8 months+)"), A("Flavour","Rice")),
          Tags("babyfood","cerelac","rice","stage2"),
          Imgs("1039","1040","1041")),

        P(cat, "Farex Starter Rice Cereal", "farex-starter-rice-cereal",
          "Farex Stage 1 rice cereal is the perfect first solid food for babies from 4 months. Smooth texture and easily digestible.",
          Vs(V("300g", 199, 219, 40), V("1kg", 599, 639, 20)),
          As(A("Brand","Farex"), A("Stage","1 (4 months+)"), A("Type","Rice Cereal")),
          Tags("babyfood","farex","rice","starter"),
          Imgs("1042","1043","1044")),

        P(cat, "Enfagrow Toddler Nutritional Drink", "enfagrow-toddler-nutritional-drink",
          "Mead Johnson Enfagrow A+ with MFGM and DHA supports brain development and immunity for toddlers 1-3 years old.",
          Vs(V("400g", 549, 589, 25), V("900g", 1099, 1179, 12)),
          As(A("Brand","Mead Johnson"), A("For","Toddlers 1-3 years"), A("Key Nutrients","MFGM, DHA")),
          Tags("toddler","milk","formula","growth"),
          Imgs("1045","1046","1047")),

        P(cat, "Nestle NAN Pro 1", "nestle-nan-pro-1",
          "Nestle NAN PRO 1 infant formula with OPTIPRO protein system supports healthy growth from birth to 6 months when breastfeeding is not possible.",
          Vs(V("400g", 649, 699, 20), V("900g", 1299, 1399, 10)),
          As(A("Brand","Nestle"), A("For","0-6 months"), A("Type","Infant Formula")),
          Tags("formulamilk","nan","nestle","infant"),
          Imgs("1048","1049","1050")),

        P(cat, "Pigeon Baby Feeding Bottle 150ml", "pigeon-baby-feeding-bottle-150ml",
          "Pigeon slim-neck feeding bottle with soft natural-feel teat makes transition from breast to bottle easy. BPA-free polypropylene.",
          Vs(V("1 pc", 299, 329, 40), V("2 pcs", 549, 589, 20)),
          As(A("Brand","Pigeon"), A("Capacity","150ml"), A("BPA Free","Yes")),
          Tags("feedingbottle","pigeon","bpa-free","baby"),
          Imgs("1051","1052","1053")),

        P(cat, "Mee Mee Feeding Bottle 250ml", "mee-mee-feeding-bottle-250ml",
          "Mee Mee wide-neck feeding bottle with anti-colic venting system reduces gas and discomfort. Easy to clean and assemble.",
          Vs(V("1 pc", 249, 269, 40), V("2 pcs", 449, 479, 20)),
          As(A("Brand","Mee Mee"), A("Capacity","250ml"), A("Anti-Colic","Yes")),
          Tags("feedingbottle","meemee","250ml","baby"),
          Imgs("1054","1055","1056")),

        P(cat, "Chicco Soother Pacifier", "chicco-soother-pacifier",
          "Chicco physio soother with anatomical shape mimics the mother's breast and supports natural oral development. BPA-free silicone.",
          Vs(V("1 pc", 349, 379, 30), V("2 pcs", 629, 679, 15)),
          As(A("Brand","Chicco"), A("Material","Silicone"), A("BPA Free","Yes")),
          Tags("pacifier","chicco","soother","baby"),
          Imgs("1057","1058","1059")),

        P(cat, "Johnson's Baby Powder 100g", "johnsons-baby-powder-100g",
          "Johnson's baby powder with pure cosmetic talc keeps baby's skin dry, smooth and rash-free. Dermatologist tested.",
          Vs(V("100g", 99, null, 80), V("300g", 249, 269, 50)),
          As(A("Brand","Johnson's"), A("Type","Talc Powder"), A("For","Babies")),
          Tags("babypowder","johnsons","talc","fresh"),
          Imgs("1060","1061","1062")),

        P(cat, "Himalaya Nappy Rash Cream", "himalaya-nappy-rash-cream",
          "Himalaya Nappy Rash Cream with Aloe Vera and Almond Oil soothes and protects against nappy rash. Safe for daily use.",
          Vs(V("50g", 149, 159, 60), V("100g", 259, 279, 35)),
          As(A("Brand","Himalaya"), A("Key Ingredients","Aloe Vera, Almond Oil"), A("For","Nappy Rash")),
          Tags("nappyrash","himalaya","cream","soothing"),
          Imgs("1063","1064","1065")),

        P(cat, "Pampers Baby Wipes", "pampers-baby-wipes",
          "Pampers Sensitive baby wipes are enriched with aloe and vitamin E to gently clean and protect delicate skin. Clinically tested.",
          Vs(V("72 pcs", 199, 219, 50), V("144 pcs", 369, 399, 25)),
          As(A("Brand","Pampers"), A("Type","Sensitive Wipes"), A("With Aloe","Yes")),
          Tags("babywipes","pampers","wet","gentle"),
          Imgs("1066","1067","1068")),

        P(cat, "Huggies Baby Wipes", "huggies-baby-wipes",
          "Huggies Natural Care baby wipes with aloe vera and chamomile gently clean while moisturising baby's skin. 99% pure water.",
          Vs(V("72 pcs", 189, 209, 50), V("144 pcs", 349, 379, 25)),
          As(A("Brand","Huggies"), A("Key Ingredients","Aloe Vera, Chamomile"), A("Water Content","99%")),
          Tags("babywipes","huggies","soft","clean"),
          Imgs("1069","1070","1071")),

        P(cat, "Mee Mee Baby Nail Clipper", "mee-mee-baby-nail-clipper",
          "Mee Mee safe baby nail clipper with curved blades designed to safely trim tiny nails without nicking delicate skin.",
          Vs(V("1 pc", 149, null, 50)),
          As(A("Brand","Mee Mee"), A("Type","Nail Clipper"), A("Safe Edge","Yes")),
          Tags("nailclipper","baby","safe","meemee"),
          Imgs("1072","1073","1074")),

        P(cat, "Chicco Baby Comb & Brush Set", "chicco-baby-comb-brush-set",
          "Chicco gentle comb and brush set with soft nylon bristles for delicate newborn hair. Ergonomic handles for easy grip.",
          Vs(V("1 set", 249, null, 40)),
          As(A("Brand","Chicco"), A("Set Includes","1 Comb, 1 Brush"), A("Bristle","Soft Nylon")),
          Tags("comb","brush","baby","soft","chicco"),
          Imgs("1075","1076","1077")),

        P(cat, "LuvLap Baby Carrier", "luvlap-baby-carrier",
          "LuvLap ergonomic baby carrier distributes weight evenly across hips and shoulders for comfortable hands-free carrying. Suitable for 0-18 months.",
          Vs(V("1 pc Standard", 799, 849, 20), V("1 pc Premium", 1299, 1399, 10)),
          As(A("Brand","LuvLap"), A("For","0-18 months"), A("Type","Ergonomic Carrier")),
          Tags("babycarrier","luvlap","ergonomic","wrap"),
          Imgs("1078","1079","1080")),
    ];

    private static List<Product> BuildPetCareProducts(Category cat) =>
    [
        P(cat, "Pedigree Adult Dog Food Chicken", "pedigree-adult-dog-food-chicken",
          "Pedigree Adult dry dog food with real chicken and vegetables provides complete and balanced nutrition. Supports healthy bones, skin and coat.",
          Vs(V("400g", 149, null, 70), V("1.2kg", 399, 429, 40), V("3kg", 899, 969, 20)),
          As(A("Brand","Pedigree"), A("For","Adult Dogs"), A("Flavour","Chicken")),
          Tags("dogfood","pedigree","chicken","adult"),
          Imgs("1100","1101","1102")),

        P(cat, "Pedigree Puppy Food", "pedigree-puppy-food",
          "Pedigree Puppy with chicken and milk is specially formulated with DHA for healthy brain development and strong teeth. Complete nutrition for growing pups.",
          Vs(V("400g", 169, null, 60), V("1.2kg", 429, 459, 30)),
          As(A("Brand","Pedigree"), A("For","Puppies"), A("Key Nutrient","DHA")),
          Tags("dogfood","pedigree","puppy","growth"),
          Imgs("1103","1104","1105")),

        P(cat, "Royal Canin Adult Dog Food", "royal-canin-adult-dog-food",
          "Royal Canin Adult Maintenance provides precise nutritional needs for adult dogs. Supports digestive health and maintains ideal weight.",
          Vs(V("1kg", 699, 749, 30), V("3kg", 1899, 2049, 15)),
          As(A("Brand","Royal Canin"), A("For","Adult Dogs"), A("Type","Dry Food")),
          Tags("dogfood","royalcanin","premium","adult"),
          Imgs("1106","1107","1108")),

        P(cat, "Drools Focus Adult Dog Food", "drools-focus-adult-dog-food",
          "Drools Focus Super Premium adult dog food with real chicken and fish oil promotes healthy skin, coat and strong immunity.",
          Vs(V("1.2kg", 349, 379, 40), V("3kg", 799, 849, 20)),
          As(A("Brand","Drools"), A("For","Adult Dogs"), A("Key Ingredient","Real Chicken")),
          Tags("dogfood","drools","chicken","adult"),
          Imgs("1109","1110","1111")),

        P(cat, "Purina Dog Chow Adult", "purina-dog-chow-adult",
          "Purina Dog Chow Complete with real chicken supports strong muscles and healthy joints in adult dogs. No artificial colours.",
          Vs(V("1.2kg", 399, 429, 35), V("3kg", 849, 909, 18)),
          As(A("Brand","Purina"), A("For","Adult Dogs"), A("No Artificial Colours","Yes")),
          Tags("dogfood","purina","dogchow","adult"),
          Imgs("1112","1113","1114")),

        P(cat, "Pedigree Dentastix Dog Treats", "pedigree-dentastix-dog-treats",
          "Pedigree Dentastix daily dental chews reduce plaque and tartar build-up by up to 80%. X-shape allows flexing for thorough cleaning.",
          Vs(V("7 sticks", 99, null, 80), V("21 sticks", 269, 289, 40)),
          As(A("Brand","Pedigree"), A("Type","Dental Chew"), A("Plaque Reduction","Up to 80%")),
          Tags("dogtreats","dentastix","pedigree","oral"),
          Imgs("1115","1116","1117")),

        P(cat, "Drools Dog Treats Chicken", "drools-dog-treats-chicken",
          "Drools 100% chicken treats are a healthy, high-protein reward for training and bonding. No added preservatives or artificial flavours.",
          Vs(V("70g", 99, null, 80), V("200g", 249, 269, 40)),
          As(A("Brand","Drools"), A("Flavour","Chicken"), A("Protein","High")),
          Tags("dogtreats","drools","chicken","reward"),
          Imgs("1118","1119","1120")),

        P(cat, "Pedigree Wet Food Pouch", "pedigree-wet-food-pouch",
          "Pedigree wet food pouches in a rich gravy sauce are a delicious complement to dry food. Easy-open and no mess.",
          Vs(V("3×70g", 129, null, 70), V("6×70g", 239, 259, 35)),
          As(A("Brand","Pedigree"), A("Type","Wet Food"), A("Format","Pouch")),
          Tags("wetfood","pedigree","pouch","gravy"),
          Imgs("1121","1122","1123")),

        P(cat, "Whiskas Adult Cat Food Ocean Fish", "whiskas-adult-cat-food-ocean-fish",
          "Whiskas adult dry cat food with ocean fish flavour provides essential taurine for healthy heart and eyesight. Complete and balanced nutrition.",
          Vs(V("480g", 279, 299, 40), V("1.2kg", 599, 639, 20)),
          As(A("Brand","Whiskas"), A("For","Adult Cats"), A("Flavour","Ocean Fish")),
          Tags("catfood","whiskas","oceanfish","adult"),
          Imgs("1124","1125","1126")),

        P(cat, "Royal Canin Adult Cat Food", "royal-canin-adult-cat-food",
          "Royal Canin Adult dry cat food maintains ideal body weight and supports digestive health with precise nutritional balance.",
          Vs(V("400g", 399, 429, 30), V("2kg", 1699, 1799, 12)),
          As(A("Brand","Royal Canin"), A("For","Adult Cats"), A("Type","Dry Food")),
          Tags("catfood","royalcanin","premium","adult"),
          Imgs("1127","1128","1129")),

        P(cat, "Meow Mix Cat Food", "meow-mix-cat-food",
          "Meow Mix original dry cat food with the taste cats love in four flavours. 100% complete and balanced for adult cats.",
          Vs(V("300g", 199, 219, 40), V("900g", 499, 539, 20)),
          As(A("Brand","Meow Mix"), A("Flavours","4 Meat Flavours"), A("Type","Dry Food")),
          Tags("catfood","meowmix","chicken","adult"),
          Imgs("1130","1131","1132")),

        P(cat, "Whiskas Wet Food Pouches", "whiskas-wet-food-pouches",
          "Whiskas wet food pouches with real fish in jelly provide moisture and variety for cats. Delicious complement to dry food.",
          Vs(V("3×70g", 119, null, 70), V("6×70g", 219, 239, 35)),
          As(A("Brand","Whiskas"), A("Type","Wet Food"), A("Format","Pouch in Jelly")),
          Tags("wetfood","whiskas","pouch","cat"),
          Imgs("1133","1134","1135")),

        P(cat, "Dreamies Cat Treats", "dreamies-cat-treats",
          "Dreamies crunchy cat treats with a creamy centre are irresistible to cats. Perfect for rewarding and bonding during training.",
          Vs(V("60g", 149, 159, 60), V("3×60g", 399, 429, 25)),
          As(A("Brand","Dreamies"), A("Flavour","Chicken"), A("Type","Crunchy Treat")),
          Tags("cattreats","dreamies","chicken","reward"),
          Imgs("1136","1137","1138")),

        P(cat, "Temptations Cat Treats", "temptations-cat-treats",
          "Temptations MixUps treats are crunchy on the outside and soft and creamy on the inside — cats go crazy for them. Under 2 calories each.",
          Vs(V("85g", 179, 199, 50), V("3×85g", 499, 539, 20)),
          As(A("Brand","Temptations"), A("Calories","< 2 per treat"), A("Texture","Crunchy & Soft")),
          Tags("cattreats","temptations","tasty","cat"),
          Imgs("1139","1140","1141")),

        P(cat, "Wahl Pet Shampoo", "wahl-pet-shampoo",
          "Wahl natural pet shampoo with coconut lime verbena cleans and conditions dog's coat gently. Alcohol-free and pH balanced.",
          Vs(V("500ml", 349, 379, 30), V("1L", 599, 649, 15)),
          As(A("Brand","Wahl"), A("For","Dogs"), A("pH Balanced","Yes")),
          Tags("petshampoo","wahl","dog","gentle"),
          Imgs("1142","1143","1144")),

        P(cat, "TropiClean Cat Shampoo", "tropiclean-cat-shampoo",
          "TropiClean Luxury 2-in-1 cat shampoo cleans and conditions in a single step, leaving a fresh, clean scent. Soap-free formula.",
          Vs(V("355ml", 499, 539, 20)),
          As(A("Brand","TropiClean"), A("For","Cats"), A("2-in-1","Yes")),
          Tags("catshampoo","tropiclean","gentle","cat"),
          Imgs("1145","1146","1147")),

        P(cat, "Dog Collar Nylon", "dog-collar-nylon",
          "Durable nylon dog collar with quick-release buckle and adjustable strap. D-ring for leash attachment, reflective strip for night safety.",
          Vs(V("M", 149, null, 60), V("L", 179, null, 40)),
          As(A("Material","Nylon"), A("Closure","Quick Release"), A("Reflective","Yes")),
          Tags("dogcollar","nylon","medium","adjustable"),
          Imgs("1148","1149","1150")),

        P(cat, "Pet Leash", "pet-leash",
          "Heavy-duty nylon dog leash with padded handle for comfortable grip. Available in 1.5m and 2m lengths for daily walks.",
          Vs(V("1.5m", 179, null, 50), V("2m", 219, null, 35)),
          As(A("Material","Nylon"), A("Handle","Padded"), A("D-Ring","Stainless Steel")),
          Tags("petleash","dog","walk","nylon"),
          Imgs("1151","1152","1153")),

        P(cat, "Stainless Steel Dog Bowl", "stainless-steel-dog-bowl",
          "Heavy-duty stainless steel pet bowl with a non-slip rubber base prevents tipping and sliding. Rust-proof and dishwasher safe.",
          Vs(V("Small", 149, null, 50), V("Medium", 199, null, 40), V("Large", 249, null, 30)),
          As(A("Material","Stainless Steel"), A("Non-Slip Base","Yes"), A("Dishwasher Safe","Yes")),
          Tags("dogbowl","steel","food","water"),
          Imgs("1154","1155","1156")),

        P(cat, "Catit Cat Litter", "catit-cat-litter",
          "Catit Natural clumping cat litter absorbs liquid and odour quickly, forming tight clumps for easy scooping. Dust-free formula.",
          Vs(V("5L", 299, 329, 30), V("10L", 549, 589, 15)),
          As(A("Brand","Catit"), A("Type","Clumping"), A("Dust Free","Yes")),
          Tags("catlitter","catit","clumping","odour"),
          Imgs("1157","1158","1159")),

        P(cat, "Fresh Step Cat Litter", "fresh-step-cat-litter",
          "Fresh Step Scented cat litter with activated charcoal fights odour 10x better. Tight clumps make scooping easy, keeps home fresh.",
          Vs(V("4.5kg", 499, 539, 25), V("9kg", 899, 969, 12)),
          As(A("Brand","Fresh Step"), A("Type","Scented Clumping"), A("Activated Charcoal","Yes")),
          Tags("catlitter","freshstep","scented","clumping"),
          Imgs("1160","1161","1162")),

        P(cat, "Pet Grooming Brush", "pet-grooming-brush",
          "Self-cleaning slicker brush removes loose fur, tangles and dirts from both cats and dogs gently. Ergonomic handle for easy use.",
          Vs(V("Standard", 199, null, 50), V("Deshedding", 349, 379, 25)),
          As(A("Type","Slicker Brush"), A("Self Cleaning","Yes"), A("For","Dogs & Cats")),
          Tags("groomingbrush","pet","deshedding","fur"),
          Imgs("1163","1164","1165")),

        P(cat, "Nylabone Dog Chew Toy", "nylabone-dog-chew-toy",
          "Nylabone durable chew toy redirects destructive chewing and cleans teeth while your dog chews. Long-lasting nylon construction.",
          Vs(V("Small", 299, null, 40), V("Medium", 449, null, 25)),
          As(A("Brand","Nylabone"), A("Material","Durable Nylon"), A("Benefit","Dental Health")),
          Tags("dogtoy","nylabone","chew","durable"),
          Imgs("1166","1167","1168")),

        P(cat, "Kong Classic Dog Toy", "kong-classic-dog-toy",
          "KONG Classic's unique rubber formula bounces unpredictably for extended play. Fill with treats to provide mental stimulation and curb boredom.",
          Vs(V("Small", 399, null, 30), V("Medium", 549, null, 20)),
          As(A("Brand","KONG"), A("Material","Natural Rubber"), A("Treat Fillable","Yes")),
          Tags("dogtoy","kong","classic","rubber"),
          Imgs("1169","1170","1171")),

        P(cat, "Tick & Flea Powder", "tick-flea-powder",
          "Herbal tick and flea repellent powder for dogs, safe and chemical-free. Sprinkle on coat and bedding for complete protection.",
          Vs(V("100g", 149, null, 50), V("200g", 259, 279, 25)),
          As(A("Type","Powder"), A("For","Dogs"), A("Natural","Yes")),
          Tags("tickpowder","flea","pest","dog"),
          Imgs("1172","1173","1174")),

        P(cat, "Beaphar Ear Drops for Pets", "beaphar-ear-drops",
          "Beaphar ear drops gently clean and soothe ear canals in cats and dogs, preventing ear mites and infection. Easy dropper application.",
          Vs(V("10ml", 199, null, 40)),
          As(A("Brand","Beaphar"), A("For","Cats & Dogs"), A("Volume","10ml")),
          Tags("eardrops","beaphar","ear","pet"),
          Imgs("1175","1176","1177")),
    ];

    private static List<Product> BuildPharmaProducts(Category cat) =>
    [
        P(cat, "Disprin Regular Aspirin", "disprin-regular-aspirin",
          "Disprin effervescent aspirin tablets dissolve quickly for fast pain relief from headache, toothache and fever. Low-acid, gentle on stomach.",
          Vs(V("10 tabs", 19, null, 100), V("30 tabs", 49, null, 70)),
          As(A("Brand","Disprin"), A("Salt","Aspirin 350mg"), A("For","Pain & Fever")),
          Tags("painkiller","disprin","aspirin","headache"),
          Imgs("1200","1201","1202")),

        P(cat, "Crocin Advance 500mg", "crocin-advance-500mg",
          "Crocin Advance paracetamol tablet provides fast and effective relief from fever and mild to moderate pain. Starts working in 30 minutes.",
          Vs(V("15 tabs", 35, null, 100), V("30 tabs", 65, null, 70)),
          As(A("Brand","Crocin"), A("Salt","Paracetamol 500mg"), A("Relief In","30 minutes")),
          Tags("paracetamol","crocin","fever","pain"),
          Imgs("1203","1204","1205")),

        P(cat, "Volini Pain Relief Spray", "volini-pain-relief-spray",
          "Volini topical analgesic spray with Diclofenac reaches deep muscle tissues for fast relief from back pain, joint pain and sprains.",
          Vs(V("40g", 149, 169, 50), V("100g", 299, 329, 25)),
          As(A("Brand","Volini"), A("Active","Diclofenac"), A("Type","Spray")),
          Tags("painrelief","volini","spray","muscle"),
          Imgs("1206","1207","1208")),

        P(cat, "Moov Pain Relief Cream", "moov-pain-relief-cream",
          "Moov Fast Relief cream with Diclofenac Diethylamine penetrates deep to provide targeted pain relief. Absorbed in 60 seconds.",
          Vs(V("25g", 89, null, 70), V("50g", 159, 169, 40)),
          As(A("Brand","Moov"), A("Active","Diclofenac"), A("Absorbed In","60 seconds")),
          Tags("painrelief","moov","cream","joint"),
          Imgs("1209","1210","1211")),

        P(cat, "Iodex Balm", "iodex-balm",
          "Iodex multi-purpose pain balm with Methyl Salicylate provides soothing relief from muscle stiffness and backache. Trusted for 100 years.",
          Vs(V("8g", 49, null, 100), V("16g", 89, null, 60)),
          As(A("Brand","Iodex"), A("Active","Methyl Salicylate"), A("Type","Balm")),
          Tags("balm","iodex","muscle","pain"),
          Imgs("1212","1213","1214")),

        P(cat, "ENO Fruit Salt Regular", "eno-fruit-salt-regular",
          "ENO fruit salt provides fast relief from acidity, heartburn and indigestion in just 6 seconds. Naturally flavoured with fruit salts.",
          Vs(V("30g", 49, null, 100), V("100g", 129, 139, 60)),
          As(A("Brand","ENO"), A("For","Acidity Relief"), A("Relief In","6 seconds")),
          Tags("eno","acidity","digestive","antacid"),
          Imgs("1215","1216","1217")),

        P(cat, "Hajmola Regular Digestive Tabs", "hajmola-regular-tabs",
          "Hajmola digestive candy tablets made with Ayurvedic herbs aid digestion after heavy meals. Tangy and delicious.",
          Vs(V("120 tabs", 49, null, 100), V("240 tabs", 89, null, 60)),
          As(A("Brand","Dabur"), A("Type","Digestive Candy"), A("Ayurvedic","Yes")),
          Tags("hajmola","digestive","churan","after-meal"),
          Imgs("1218","1219","1220")),

        P(cat, "Pudin Hara Pearls", "pudin-hara-pearls",
          "Dabur Pudin Hara peppermint pearls provide quick relief from gas, acidity and stomach pain. Cool and refreshing.",
          Vs(V("10 caps", 29, null, 100), V("30 caps", 79, null, 60)),
          As(A("Brand","Dabur"), A("Key Ingredient","Peppermint Oil"), A("Form","Liquid Capsule")),
          Tags("pudinhara","mint","acidity","gas"),
          Imgs("1221","1222","1223")),

        P(cat, "Sat Isabgol Husk", "isabgol-husk",
          "Sat Isabgol (psyllium husk) is a natural fibre supplement that relieves constipation and supports digestive health. Mix with water or juice.",
          Vs(V("100g", 89, null, 70), V("200g", 159, 169, 40)),
          As(A("Brand","Dabur"), A("Type","Psyllium Husk"), A("Fibre Content","High")),
          Tags("isabgol","constipation","fiber","digestion"),
          Imgs("1224","1225","1226")),

        P(cat, "ORS Electral Powder", "ors-electral-powder",
          "Electral ORS powder with WHO-recommended electrolyte formula rehydrates quickly after diarrhoea, vomiting or dehydration.",
          Vs(V("4.4g×5", 49, null, 100), V("4.4g×10", 89, null, 60)),
          As(A("Brand","Electral"), A("Type","ORS"), A("Formula","WHO Recommended")),
          Tags("ors","electral","dehydration","salt"),
          Imgs("1227","1228","1229")),

        P(cat, "Vicks VapoRub", "vicks-vaporub",
          "Vicks VapoRub topical chest rub with camphor, eucalyptus and menthol relieves cough, nasal congestion and body ache.",
          Vs(V("25ml", 69, null, 100), V("50ml", 119, 129, 70)),
          As(A("Brand","Vicks"), A("Key Actives","Camphor, Eucalyptus, Menthol"), A("For","Cough & Cold")),
          Tags("vicks","vapourub","cold","cough"),
          Imgs("1230","1231","1232")),

        P(cat, "Strepsils Throat Lozenges", "strepsils-throat-lozenges",
          "Strepsils lozenges contain two antibacterials that fight the bacteria causing sore throats. Provides soothing relief for up to 3 hours.",
          Vs(V("8 pcs", 49, null, 100), V("16 pcs", 89, null, 60)),
          As(A("Brand","Strepsils"), A("For","Sore Throat"), A("Flavour","Original")),
          Tags("strepsils","throat","lozenge","cold"),
          Imgs("1233","1234","1235")),

        P(cat, "Benadryl Cough Syrup", "benadryl-cough-syrup",
          "Benadryl dry cough syrup with Diphenhydramine HCl suppresses the cough reflex for soothing relief from dry, irritating coughs.",
          Vs(V("100ml", 89, 99, 60), V("200ml", 159, 169, 35)),
          As(A("Brand","Benadryl"), A("Type","Dry Cough"), A("Active","Diphenhydramine")),
          Tags("coughsyrup","benadryl","cold","cough"),
          Imgs("1236","1237","1238")),

        P(cat, "Band-Aid Strips", "band-aid-strips",
          "Band-Aid Flexible Fabric strips with Quiltvent technology move with fingers, knuckles and joints. Sterile, easy to apply and remove.",
          Vs(V("10 pcs", 49, null, 100), V("30 pcs", 119, 129, 60)),
          As(A("Brand","Band-Aid"), A("Type","Flexible Fabric"), A("Sterile","Yes")),
          Tags("bandaid","firstaid","wound","plaster"),
          Imgs("1239","1240","1241")),

        P(cat, "Dettol Antiseptic Liquid", "dettol-antiseptic-liquid",
          "Dettol Antiseptic Liquid provides first-line defence against infection for cuts, grazes and insect bites. Dilute in water before use.",
          Vs(V("100ml", 89, null, 70), V("250ml", 179, 199, 40)),
          As(A("Brand","Dettol"), A("Active","Chloroxylenol 4.8%"), A("Use","Wound Antiseptic")),
          Tags("dettol","antiseptic","wound","disinfect"),
          Imgs("1242","1243","1244")),

        P(cat, "Savlon Antiseptic Cream", "savlon-antiseptic-cream",
          "Savlon antiseptic cream prevents and treats infections in cuts, grazes and minor burns. Forms a protective barrier that heals.",
          Vs(V("25g", 69, null, 80), V("60g", 129, 139, 50)),
          As(A("Brand","Savlon"), A("Active","Chlorhexidine + Cetrimide"), A("For","Cuts & Burns")),
          Tags("savlon","antiseptic","cream","wound"),
          Imgs("1245","1246","1247")),

        P(cat, "Digene Antacid Gel", "digene-antacid-gel",
          "Digene gel provides fast, long-lasting relief from acidity, heartburn and sour burps. Pleasant mint flavour.",
          Vs(V("200ml", 89, null, 70), V("450ml", 179, 199, 35)),
          As(A("Brand","Digene"), A("Form","Gel"), A("Flavour","Mint"), A("For","Acidity")),
          Tags("digene","antacid","acidity","stomach"),
          Imgs("1248","1249","1250")),

        P(cat, "Revital H Capsules", "revital-h-capsules",
          "Revital H multivitamin with ginseng provides complete nutrition for daily energy, vitality and immunity. 27 essential vitamins and minerals.",
          Vs(V("30 caps", 299, 329, 40), V("60 caps", 549, 589, 20)),
          As(A("Brand","Revital"), A("Type","Multivitamin"), A("Key Addition","Ginseng"), A("Count","27 nutrients")),
          Tags("revital","multivitamin","energy","capsule"),
          Imgs("1251","1252","1253")),

        P(cat, "Supradyn Daily Multivitamin", "supradyn-daily-multivitamin",
          "Supradyn tablets provide a complete blend of 12 vitamins, 3 minerals and trace elements for daily nutritional support and energy.",
          Vs(V("15 tabs", 149, 159, 60), V("30 tabs", 279, 299, 30)),
          As(A("Brand","Bayer"), A("Type","Multivitamin"), A("Vitamins","12")),
          Tags("supradyn","multivitamin","daily","tablet"),
          Imgs("1254","1255","1256")),

        P(cat, "Vitamin C 500mg Tablet", "vitamin-c-500mg-tablet",
          "Vitamin C 500mg effervescent tablets support immunity, collagen synthesis and iron absorption. Dissolve in water for a refreshing drink.",
          Vs(V("20 tabs", 89, null, 70), V("60 tabs", 239, 259, 35)),
          As(A("Type","Effervescent Tablet"), A("Dosage","500mg"), A("Benefit","Immunity")),
          Tags("vitaminc","immunity","supplement","tablet"),
          Imgs("1257","1258","1259")),

        P(cat, "Calcium Sandoz Tablet", "calcium-sandoz-tablet",
          "Calcium Sandoz provides 500mg calcium and Vitamin D3 to maintain bone density and prevent osteoporosis. Effervescent and easy to take.",
          Vs(V("20 tabs", 149, 159, 60), V("60 tabs", 399, 429, 25)),
          As(A("Brand","Sandoz"), A("Calcium","500mg"), A("With Vitamin D3","Yes")),
          Tags("calcium","bone","supplement","tablet"),
          Imgs("1260","1261","1262")),

        P(cat, "Fish Oil Omega-3 Capsules", "fish-oil-omega-3-capsules",
          "High-potency fish oil capsules with 1000mg Omega-3 EPA and DHA support heart, brain and joint health. Odourless, burp-free formula.",
          Vs(V("30 caps", 199, 219, 50), V("60 caps", 369, 399, 25)),
          As(A("Type","Fish Oil"), A("Omega-3","1000mg"), A("Burp Free","Yes")),
          Tags("fishoil","omega3","heart","supplement"),
          Imgs("1263","1264","1265")),

        P(cat, "Omron Digital Thermometer", "omron-digital-thermometer",
          "Omron MC-246 digital thermometer gives accurate temperature readings in 30 seconds with a beep alert. Flexible probe for comfort.",
          Vs(V("1 pc", 299, 329, 30)),
          As(A("Brand","Omron"), A("Type","Digital"), A("Reading Time","30 seconds"), A("Beep Alert","Yes")),
          Tags("thermometer","digital","fever","omron"),
          Imgs("1266","1267","1268")),

        P(cat, "Dr. Morepen Glucometer", "dr-morepen-glucometer",
          "Dr. Morepen BG-03 glucometer provides accurate blood glucose readings in 5 seconds. No coding required and memory for 300 readings.",
          Vs(V("1 pc", 699, 749, 20), V("Kit with 50 strips", 999, 1099, 10)),
          As(A("Brand","Dr. Morepen"), A("Reading Time","5 seconds"), A("Memory","300 readings")),
          Tags("glucometer","drmorepen","sugar","diabetes"),
          Imgs("1269","1270","1271")),

        P(cat, "Pulse Oximeter", "pulse-oximeter",
          "Fingertip pulse oximeter measures blood oxygen saturation (SpO2) and pulse rate accurately in seconds. Large LED display with auto-off.",
          Vs(V("Standard", 499, 549, 25), V("Pro with app sync", 799, 849, 12)),
          As(A("Measures","SpO2, Pulse Rate"), A("Display","LED"), A("Auto Off","Yes")),
          Tags("oximeter","spo2","pulse","oxygen"),
          Imgs("1272","1273","1274")),

        P(cat, "BP Monitor Digital", "bp-monitor-digital",
          "Digital blood pressure monitor measures systolic and diastolic pressure and pulse at home accurately. WHO blood pressure classification indicator included.",
          Vs(V("1 pc Standard", 1299, 1399, 15), V("1 pc Advanced with app", 1799, 1899, 8)),
          As(A("Measures","BP + Pulse"), A("Memory","60 readings"), A("WHO Indicator","Yes")),
          Tags("bpmonitor","digital","blood","pressure"),
          Imgs("1275","1276","1277")),

        P(cat, "Electric Heating Pad", "electric-heating-pad",
          "Electric heating pad with 3 temperature settings provides soothing heat therapy for muscle pain, cramps and joint stiffness. Auto shut-off after 30 minutes.",
          Vs(V("Standard", 399, 429, 30), V("XL", 599, 649, 15)),
          As(A("Settings","3 Temperature"), A("Auto Shut-off","30 min"), A("Size","Standard / XL")),
          Tags("heatingpad","electric","pain","relief"),
          Imgs("1278","1279","1280")),
    ];

    private static List<Product> BuildBeautyProducts(Category cat) =>
    [
        P(cat, "Lakme Absolute Kajal", "lakme-absolute-kajal",
          "Lakme Absolute Kohl Ultimate kajal delivers intense black pigment that lasts 16 hours without smudging. Dermatologist tested and ophthalmologist approved.",
          Vs(V("1 pc Black", 199, 219, 60), V("1 pc Brown", 199, 219, 50)),
          As(A("Brand","Lakme"), A("Type","Kajal"), A("Long-lasting","16 hours")),
          Tags("kajal","lakme","eyes","makeup"),
          Imgs("1300","1301","1302")),

        P(cat, "Maybelline Colossal Kajal", "maybelline-colossal-kajal",
          "Maybelline Colossal Kajal gives 12-hour intense black definition to eyes. Smooth application and smudge-free formula.",
          Vs(V("1 pc", 199, 219, 70), V("2 pcs", 369, 399, 35)),
          As(A("Brand","Maybelline"), A("Type","Kajal"), A("Duration","12 hours")),
          Tags("kajal","maybelline","colossal","dark"),
          Imgs("1303","1304","1305")),

        P(cat, "Lakme Lip Color", "lakme-lip-color",
          "Lakme Enrich Satin lip colour delivers creamy satin colour with conditioning care. Long-lasting formula keeps lips soft.",
          Vs(V("1 pc Red", 249, 269, 50), V("1 pc Pink", 249, 269, 50)),
          As(A("Brand","Lakme"), A("Finish","Satin"), A("Type","Lipstick")),
          Tags("lipstick","lakme","red","makeup"),
          Imgs("1306","1307","1308")),

        P(cat, "Maybelline Fit Me Foundation", "maybelline-fitme-foundation",
          "Maybelline Fit Me Matte + Poreless foundation matches natural skin tone and controls oil all day. Blurs pores for a flawless finish.",
          Vs(V("30ml Ivory", 449, 479, 40), V("30ml Buff Beige", 449, 479, 40)),
          As(A("Brand","Maybelline"), A("Finish","Matte"), A("SPF","18")),
          Tags("foundation","maybelline","fitme","coverage"),
          Imgs("1309","1310","1311")),

        P(cat, "Lakme 9-to-5 Primer", "lakme-9to5-primer",
          "Lakme 9-to-5 Weightless Mousse Primer prepares skin for makeup and keeps it fresh and matte for 9 hours. Lightweight gel formula.",
          Vs(V("1 pc", 349, 369, 40)),
          As(A("Brand","Lakme"), A("Finish","Matte"), A("Duration","9 hours")),
          Tags("primer","lakme","face","base"),
          Imgs("1312","1313","1314")),

        P(cat, "Faces Canada Compact Powder", "faces-canada-compact-powder",
          "Faces Canada Ultime Pro HD Studio Face Powder gives a smooth, transfer-resistant matte finish. Builds and blends easily.",
          Vs(V("9g Beige", 299, 329, 35), V("9g Natural", 299, 329, 35)),
          As(A("Brand","Faces Canada"), A("Finish","Matte"), A("Coverage","Medium")),
          Tags("compact","powder","faces","natural"),
          Imgs("1315","1316","1317")),

        P(cat, "Mamaearth Vitamin C Serum", "mamaearth-vitamin-c-serum",
          "Mamaearth Vitamin C face serum with turmeric fades dark spots and brightens skin tone naturally. Free from parabens and sulphates.",
          Vs(V("30ml", 549, 599, 40), V("60ml", 999, 1099, 20)),
          As(A("Brand","Mamaearth"), A("Key Ingredients","Vitamin C, Turmeric"), A("Free From","Paraben, Sulphate")),
          Tags("serum","vitaminc","mamaearth","glow"),
          Imgs("1318","1319","1320")),

        P(cat, "WOW Retinol Face Cream", "wow-retinol-face-cream",
          "WOW Skin Science Retinol Face Cream with hyaluronic acid and shea butter visibly reduces fine lines and firms skin overnight.",
          Vs(V("50ml", 599, 649, 30), V("100ml", 999, 1099, 15)),
          As(A("Brand","WOW"), A("Key Actives","Retinol, Hyaluronic Acid"), A("Type","Anti-Ageing")),
          Tags("retinol","wow","antiaging","face"),
          Imgs("1321","1322","1323")),

        P(cat, "Plum Green Tea Face Mask", "plum-green-tea-face-mask",
          "Plum Green Tea Pore-Cleansing Face Mask with kaolin clay draws out impurities and tightens pores. 100% vegan and cruelty-free.",
          Vs(V("100ml", 349, 379, 35), V("200ml", 599, 649, 18)),
          As(A("Brand","Plum"), A("Key Ingredients","Green Tea, Kaolin Clay"), A("Vegan","Yes")),
          Tags("facemask","greentea","plum","clay"),
          Imgs("1324","1325","1326")),

        P(cat, "Forest Essentials Face Wash", "forest-essentials-face-wash",
          "Forest Essentials Kashmiri Saffron & Neem face wash with Ayurvedic herbs deeply cleanses while maintaining skin's natural oils.",
          Vs(V("150ml", 795, 849, 20)),
          As(A("Brand","Forest Essentials"), A("Key Ingredients","Saffron, Neem"), A("Type","Luxury Ayurvedic")),
          Tags("facewash","forest","essentials","luxury"),
          Imgs("1327","1328","1329")),

        P(cat, "Biotique Bio Papaya Scrub", "biotique-bio-papaya-scrub",
          "Biotique Bio Papaya Revitalizing Tan-Removal Scrub with papain enzyme gently exfoliates dead cells for bright, smooth skin.",
          Vs(V("75g", 179, 199, 50), V("150g", 299, 329, 30)),
          As(A("Brand","Biotique"), A("Key Ingredient","Papain Enzyme"), A("Skin Type","All")),
          Tags("scrub","papaya","biotique","exfoliate"),
          Imgs("1330","1331","1332")),

        P(cat, "Himalaya Neem Face Pack", "himalaya-neem-face-pack",
          "Himalaya Purifying Neem Face Pack with neem and turmeric controls excess oil and reduces acne-causing bacteria. Ready to use.",
          Vs(V("75g", 99, null, 70), V("150g", 169, 179, 45)),
          As(A("Brand","Himalaya"), A("Key Ingredients","Neem, Turmeric"), A("For","Oily Skin")),
          Tags("facepack","neem","himalaya","purifying"),
          Imgs("1333","1334","1335")),

        P(cat, "Gatsby Hair Gel", "gatsby-hair-gel",
          "Gatsby Moving Rubber Hair Gel provides strong hold with a natural finish. Mouldable and reworkable throughout the day.",
          Vs(V("75g", 149, 159, 60), V("150g", 249, 269, 35)),
          As(A("Brand","Gatsby"), A("Hold","Strong"), A("Finish","Natural")),
          Tags("hairgel","gatsby","styling","men"),
          Imgs("1336","1337","1338")),

        P(cat, "Livon Serum", "livon-serum",
          "Livon Silky Potion hair serum with triactive complex tames frizz and gives smooth, shiny hair in just one use. Non-sticky formula.",
          Vs(V("50ml", 149, 159, 60), V("100ml", 249, 269, 35)),
          As(A("Brand","Livon"), A("For","Frizzy Hair"), A("Non-Sticky","Yes")),
          Tags("serum","livon","hair","frizz"),
          Imgs("1339","1340","1341")),

        P(cat, "Streax Hair Straightening Serum", "streax-hair-straightening-serum",
          "Streax Pro Vitariche Gloss hair serum with walnut oil seals frizz and straightens hair with heat styling. Adds brilliant shine.",
          Vs(V("100ml", 199, 219, 50), V("200ml", 349, 379, 25)),
          As(A("Brand","Streax"), A("Key Ingredient","Walnut Oil"), A("Benefit","Straightening")),
          Tags("streax","serum","straightening","hair"),
          Imgs("1342","1343","1344")),

        P(cat, "TIGI Bed Head Hair Wax", "tigi-bed-head-hair-wax",
          "TIGI Bed Head For Men Matte Separation Wax creates a cool, messy, separated look with a matte finish. Strong hold all day.",
          Vs(V("85g", 399, 429, 25)),
          As(A("Brand","TIGI"), A("Hold","Strong"), A("Finish","Matte"), A("For","Men")),
          Tags("hairwax","tigi","bedhead","styling"),
          Imgs("1345","1346","1347")),

        P(cat, "Revlon Nail Enamel", "revlon-nail-enamel",
          "Revlon ColorStay Gel Envy nail enamel delivers gel-like color with two coats. Chip-resistant formula lasts up to 10 days.",
          Vs(V("1 pc Red", 199, 219, 50), V("1 pc Pink", 199, 219, 50)),
          As(A("Brand","Revlon"), A("Type","Gel Enamel"), A("Lasts","Up to 10 days")),
          Tags("nailpolish","revlon","red","color"),
          Imgs("1348","1349","1350")),

        P(cat, "Lakme True Wear Nail Color", "lakme-true-wear-nail-color",
          "Lakme True Wear nail color with Chip Guard technology prevents chipping and lasts longer. Available in trendy shades.",
          Vs(V("1 pc", 99, null, 80), V("3 pcs", 269, 289, 35)),
          As(A("Brand","Lakme"), A("Technology","Chip Guard"), A("Coats Needed","2")),
          Tags("nailcolor","lakme","truewear","nail"),
          Imgs("1351","1352","1353")),

        P(cat, "Oriflame Nail Polish Remover", "oriflame-nail-polish-remover",
          "Oriflame acetone-free nail polish remover enriched with aloe vera removes polish gently without drying nails.",
          Vs(V("75ml", 99, null, 70), V("150ml", 169, 179, 40)),
          As(A("Brand","Oriflame"), A("Type","Acetone Free"), A("With Aloe Vera","Yes")),
          Tags("nailremover","oriflame","acetone","nail"),
          Imgs("1354","1355","1356")),

        P(cat, "Fogg Scent Xpression Men", "fogg-scent-xpression-men",
          "Fogg Scent Xpression for men is a long-lasting no-gas perfume body spray. Citrus and woody notes for an all-day fresh feel.",
          Vs(V("100ml", 299, 329, 50), V("150ml", 399, 429, 30)),
          As(A("Brand","Fogg"), A("For","Men"), A("Notes","Citrus, Woody"), A("No Gas","Yes")),
          Tags("perfume","fogg","men","fragrance"),
          Imgs("1357","1358","1359")),

        P(cat, "Engage Spell Women Perfume", "engage-spell-women-perfume",
          "Engage Spell is an enchanting floral perfume for women with notes of jasmine and sandalwood. Lasts all day.",
          Vs(V("100ml", 279, 299, 50), V("150ml", 379, 409, 30)),
          As(A("Brand","Engage"), A("For","Women"), A("Notes","Floral, Jasmine")),
          Tags("perfume","engage","women","floral"),
          Imgs("1360","1361","1362")),

        P(cat, "Plum BodyLovin Body Mist", "plum-bodylovin-body-mist",
          "Plum BodyLovin body mist with a fresh tropical fragrance hydrates and perfumes skin simultaneously. Vegan and cruelty-free.",
          Vs(V("100ml", 299, 329, 40), V("200ml", 499, 549, 20)),
          As(A("Brand","Plum"), A("Vegan","Yes"), A("Alcohol","Yes")),
          Tags("bodymist","plum","bodylovin","fresh"),
          Imgs("1363","1364","1365")),

        P(cat, "Axe Dark Temptation Perfume", "axe-dark-temptation-perfume",
          "Axe Dark Temptation long-lasting eau de toilette for men with an irresistible chocolate and cedar fragrance.",
          Vs(V("122ml", 299, 329, 50)),
          As(A("Brand","Axe"), A("For","Men"), A("Notes","Chocolate, Cedar"), A("Type","Eau de Toilette")),
          Tags("perfume","axe","dark","chocolate"),
          Imgs("1366","1367","1368")),

        P(cat, "Bombay Shaving Beard Oil", "bombay-shaving-beard-oil",
          "Bombay Shaving Company Beard Oil with argan and jojoba oils moisturises beard and skin underneath, reducing itch and flakiness.",
          Vs(V("30ml", 349, 379, 35), V("60ml", 599, 649, 18)),
          As(A("Brand","Bombay Shaving Company"), A("Key Oils","Argan, Jojoba"), A("For","Beard Care")),
          Tags("beardoil","bombay","shaving","grooming"),
          Imgs("1369","1370","1371")),

        P(cat, "Beardo Beard Wash", "beardo-beard-wash",
          "Beardo Activated Charcoal Beard Wash deeply cleanses beard of dirt, oil and toxins while keeping it soft and conditioned.",
          Vs(V("100ml", 299, 329, 35), V("200ml", 499, 549, 18)),
          As(A("Brand","Beardo"), A("Key Ingredient","Activated Charcoal"), A("For","Men")),
          Tags("beardwash","beardo","men","grooming"),
          Imgs("1372","1373","1374")),

        P(cat, "Gillette Fusion ProGlide Razor", "gillette-fusion-proglide-razor",
          "Gillette Fusion ProGlide with FlexBall technology responds to facial contours, cutting more hair in each stroke for a closer shave.",
          Vs(V("1 pc", 499, 549, 30), V("1 razor + 2 blades", 699, 749, 15)),
          As(A("Brand","Gillette"), A("Blades","5"), A("Technology","FlexBall")),
          Tags("razor","gillette","fusion","proglide"),
          Imgs("1375","1376","1377")),

        P(cat, "Bombay Shaving Alum Block", "bombay-shaving-alum-block",
          "Bombay Shaving Company natural alum block stops bleeding from nicks and acts as an aftershave to close pores. Natural antiseptic.",
          Vs(V("75g", 199, 219, 40)),
          As(A("Brand","Bombay Shaving Company"), A("Type","Alum Block"), A("Natural","Yes")),
          Tags("alumblock","aftershave","bombay","groom"),
          Imgs("1378","1379","1380")),
    ];

    private static List<Product> BuildFrozenFoodsProducts(Category cat) =>
    [
        P(cat, "McCain Classic French Fries", "mccain-classic-french-fries",
          "McCain Classic French Fries are made from real potatoes with a crispy golden outside. Ready in 15 minutes in an OTG or air fryer.",
          Vs(V("420g", 149, 159, 60), V("840g", 269, 289, 35)),
          As(A("Brand","McCain"), A("Type","Classic Cut"), A("Cook Method","OTG / Air Fryer")),
          Tags("frenchfries","mccain","potato","frozen"),
          Imgs("1400","1401","1402")),

        P(cat, "McCain Smiles Potato", "mccain-smiles-potato",
          "McCain Smiles are fun smiley-face shaped potato snacks that kids and adults both love. Just bake or air-fry for a quick treat.",
          Vs(V("420g", 159, 169, 60), V("840g", 289, 309, 30)),
          As(A("Brand","McCain"), A("Type","Shaped Snack"), A("For","Kids")),
          Tags("smiles","mccain","potato","kids"),
          Imgs("1403","1404","1405")),

        P(cat, "McCain Aloo Tikki", "mccain-aloo-tikki",
          "McCain Aloo Tikki made with authentic Indian spices gives a street food experience at home. Pan-fry or air-fry in 10 minutes.",
          Vs(V("400g", 159, 169, 55), V("800g", 289, 309, 28)),
          As(A("Brand","McCain"), A("Type","Indian Snack"), A("Cook","Pan Fry / Air Fry")),
          Tags("alootikki","mccain","potato","snack"),
          Imgs("1406","1407","1408")),

        P(cat, "Vezlay Veg Nuggets", "vezlay-veg-nuggets",
          "Vezlay plant-based veg nuggets made from soy protein are crispy and delicious — a healthy snack for the whole family.",
          Vs(V("250g", 199, 219, 40), V("500g", 369, 399, 20)),
          As(A("Brand","Vezlay"), A("Type","Plant-Based"), A("Protein","High")),
          Tags("nuggets","veg","frozen","snack"),
          Imgs("1409","1410","1411")),

        P(cat, "Godrej Yummiez Cheese Nuggets", "godrej-yummiez-cheese-nuggets",
          "Godrej Yummiez Cheese Nuggets with a crunchy outer coating and melty cheese centre are an irresistible frozen snack.",
          Vs(V("250g", 189, 199, 45), V("500g", 349, 369, 22)),
          As(A("Brand","Godrej Yummiez"), A("Filling","Cheese"), A("Type","Nuggets")),
          Tags("nuggets","cheese","godrej","yummiez"),
          Imgs("1412","1413","1414")),

        P(cat, "Prasuma Chicken Momos", "prasuma-chicken-momos",
          "Prasuma fresh-frozen chicken momos made with real minced chicken and aromatic spices. Steam or pan-fry in 15 minutes.",
          Vs(V("450g", 249, 269, 40), V("900g", 449, 479, 20)),
          As(A("Brand","Prasuma"), A("Type","Steamed Momo"), A("Flavour","Chicken")),
          Tags("momos","chicken","prasuma","dimsum"),
          Imgs("1415","1416","1417")),

        P(cat, "Sumeru Veg Momos", "sumeru-veg-momos",
          "Sumeru vegetable momos filled with spiced mixed vegetables, perfect for a quick evening snack. Steam, fry or microwave.",
          Vs(V("400g", 189, 199, 45), V("800g", 349, 369, 22)),
          As(A("Brand","Sumeru"), A("Type","Veg Momo"), A("Cook","Steam / Fry")),
          Tags("momos","veg","sumeru","frozen"),
          Imgs("1418","1419","1420")),

        P(cat, "WowMomo Chicken Momos Pack", "wowmomo-chicken-momos-pack",
          "WOW! Momo frozen chicken momos with the restaurant's signature recipe, ready at home. Just steam for 10 minutes.",
          Vs(V("400g", 229, 249, 35), V("800g", 419, 449, 18)),
          As(A("Brand","WOW! Momo"), A("Type","Chicken Momo"), A("Steam Time","10 minutes")),
          Tags("momos","wowmomo","chicken","frozen"),
          Imgs("1421","1422","1423")),

        P(cat, "Prasuma Pork Dimsums", "prasuma-pork-dimsums",
          "Prasuma pork dimsums made with premium pork and Chinese seasonings bring authentic dim sum flavours to your kitchen.",
          Vs(V("450g", 279, 299, 25)),
          As(A("Brand","Prasuma"), A("Type","Dimsum"), A("Filling","Pork")),
          Tags("dimsums","pork","prasuma","chinese"),
          Imgs("1424","1425","1426")),

        P(cat, "Amul Vanilla Ice Cream", "amul-vanilla-ice-cream",
          "Amul Real Ice Cream Vanilla with real cream and natural vanilla flavour — creamy, rich and classic. India's most loved ice cream brand.",
          Vs(V("500ml", 149, null, 50), V("1L", 269, null, 30)),
          As(A("Brand","Amul"), A("Flavour","Vanilla"), A("Type","Real Ice Cream")),
          Tags("icecream","amul","vanilla","frozen"),
          Imgs("1427","1428","1429")),

        P(cat, "Amul Chocolate Ice Cream", "amul-chocolate-ice-cream",
          "Amul Rich Chocolate ice cream made with pure cocoa and fresh cream is an indulgent frozen treat for all ages.",
          Vs(V("500ml", 159, null, 50), V("1L", 289, null, 30)),
          As(A("Brand","Amul"), A("Flavour","Chocolate"), A("Type","Real Ice Cream")),
          Tags("icecream","amul","chocolate","frozen"),
          Imgs("1430","1431","1432")),

        P(cat, "Kwality Walls Cornetto", "kwality-walls-cornetto",
          "Kwality Wall's Cornetto Classic with crispy cone, velvety vanilla ice cream and a chocolate-hazelnut sauce at the bottom.",
          Vs(V("2 pcs", 99, null, 60), V("4 pcs", 179, null, 30)),
          As(A("Brand","Kwality Wall's"), A("Type","Cone"), A("Flavour","Chocolate")),
          Tags("cornetto","cone","kwality","chocolate"),
          Imgs("1433","1434","1435")),

        P(cat, "Mother Dairy Kulfi", "mother-dairy-kulfi",
          "Mother Dairy's creamy kulfi bars with the authentic taste of malai and cardamom. A frozen desi classic.",
          Vs(V("6 pcs", 119, null, 50), V("12 pcs", 219, null, 25)),
          As(A("Brand","Mother Dairy"), A("Type","Kulfi Bar"), A("Flavour","Malai")),
          Tags("kulfi","motherdairy","mango","frozen"),
          Imgs("1436","1437","1438")),

        P(cat, "Havmor Mango Dolly", "havmor-mango-dolly",
          "Havmor's iconic Mango Dolly is a fruity mango ice lolly made with real Alphonso mango pulp. A refreshing summer classic.",
          Vs(V("6 pcs", 129, null, 45)),
          As(A("Brand","Havmor"), A("Flavour","Alphonso Mango"), A("Type","Ice Lolly")),
          Tags("dolly","mango","havmor","icecream"),
          Imgs("1439","1440","1441")),

        P(cat, "McCain Mixed Vegetables", "mccain-mixed-vegetables",
          "McCain Mixed Vegetables is a nutritious blend of corn, peas, carrots and beans, individually quick-frozen to retain freshness.",
          Vs(V("500g", 129, null, 60), V("1kg", 229, null, 35)),
          As(A("Brand","McCain"), A("Blend","Corn, Peas, Carrot, Beans"), A("Type","IQF")),
          Tags("mixedveg","mccain","frozen","healthy"),
          Imgs("1442","1443","1444")),

        P(cat, "Safal Frozen Green Peas", "safal-frozen-green-peas",
          "Safal frozen green peas are blanched at peak freshness and individually frozen to lock in sweetness and nutrients.",
          Vs(V("500g", 89, null, 80), V("1kg", 159, null, 45)),
          As(A("Brand","Safal"), A("Type","IQF Peas"), A("No Preservatives","Yes")),
          Tags("greenpeas","safal","frozen","veg"),
          Imgs("1445","1446","1447")),

        P(cat, "McCain Sweet Corn", "mccain-sweet-corn",
          "McCain Golden Sweet Corn kernels cut from fresh cobs and individually quick-frozen to retain natural sweetness.",
          Vs(V("400g", 129, null, 60), V("800g", 229, null, 30)),
          As(A("Brand","McCain"), A("Type","Sweet Corn"), A("IQF","Yes")),
          Tags("sweetcorn","mccain","frozen","veg"),
          Imgs("1448","1449","1450")),

        P(cat, "Sumeru Frozen Baby Potatoes", "sumeru-frozen-baby-potatoes",
          "Sumeru frozen baby potatoes are pre-cooked and seasoned, ready to roast or sauté in under 15 minutes.",
          Vs(V("500g", 99, null, 60), V("1kg", 179, null, 30)),
          As(A("Brand","Sumeru"), A("Type","Baby Potatoes"), A("Pre-cooked","Yes")),
          Tags("babypotato","sumeru","frozen","veg"),
          Imgs("1451","1452","1453")),

        P(cat, "Haldirams Dal Makhani Frozen", "haldirams-dal-makhani-frozen",
          "Haldiram's restaurant-quality Dal Makhani frozen meal with slow-cooked black lentils in rich buttery tomato gravy. Microwave ready.",
          Vs(V("285g", 149, 159, 50), V("2×285g", 269, 289, 25)),
          As(A("Brand","Haldiram's"), A("Type","Ready Meal"), A("Heat","Microwave / Stovetop")),
          Tags("dalmakhani","haldirams","readymeal","frozen"),
          Imgs("1454","1455","1456")),

        P(cat, "MTR Frozen Butter Chicken", "mtr-frozen-butter-chicken",
          "MTR Butter Chicken frozen meal with tender chicken pieces in a rich makhani sauce. Authentic flavour, restaurant-quality at home.",
          Vs(V("300g", 179, 199, 40), V("600g", 329, 349, 20)),
          As(A("Brand","MTR"), A("Type","Ready Meal"), A("Flavour","Butter Chicken")),
          Tags("butterchicken","mtr","readymeal","frozen"),
          Imgs("1457","1458","1459")),

        P(cat, "Godrej Yummiez Chicken Seekh Kebab", "godrej-yummiez-seekh-kebab",
          "Godrej Yummiez Chicken Seekh Kebabs with aromatic spices are ready to grill or pan-fry for a flavourful snack.",
          Vs(V("360g", 229, 249, 40), V("720g", 419, 449, 20)),
          As(A("Brand","Godrej Yummiez"), A("Type","Seekh Kebab"), A("Cook","Grill / Pan Fry")),
          Tags("seekhkebab","godrej","chicken","frozen"),
          Imgs("1460","1461","1462")),

        P(cat, "Freshy Frozen Parathas", "freshy-frozen-parathas",
          "Freshy plain frozen parathas made with whole wheat are a quick breakfast staple. Just tawa-cook from frozen in 5 minutes.",
          Vs(V("5 pcs", 99, null, 70), V("10 pcs", 179, null, 40)),
          As(A("Brand","Freshy"), A("Type","Plain Paratha"), A("Cook","Tawa from frozen")),
          Tags("paratha","frozen","freshy","breakfast"),
          Imgs("1463","1464","1465")),

        P(cat, "Pillsbury Frozen Garlic Bread", "pillsbury-frozen-garlic-bread",
          "Pillsbury Garlic Bread with herb-butter topping is ready to bake from frozen in 10 minutes for a crispy garlic treat.",
          Vs(V("200g", 89, null, 70), V("400g", 159, null, 40)),
          As(A("Brand","Pillsbury"), A("Type","Garlic Bread"), A("Bake From","Frozen")),
          Tags("garlicbread","pillsbury","frozen","bake"),
          Imgs("1466","1467","1468")),

        P(cat, "Amul Cheese Pizza Base", "amul-cheese-pizza-base",
          "Amul pre-baked pizza bases with mozzarella cheese layer make homemade pizza easy and delicious. Just add toppings and bake.",
          Vs(V("2 pcs", 129, null, 50), V("4 pcs", 239, null, 25)),
          As(A("Brand","Amul"), A("Cheese","Mozzarella"), A("Type","Pizza Base")),
          Tags("pizzabase","amul","cheese","frozen"),
          Imgs("1469","1470","1471")),

        P(cat, "Kwality Walls Feast Choco Bar", "kwality-walls-feast-choco-bar",
          "Kwality Wall's Feast Choco Bar with a choco-cream ice cream centre coated in milk chocolate — a classic indulgence.",
          Vs(V("4 pcs", 119, null, 50), V("8 pcs", 219, null, 25)),
          As(A("Brand","Kwality Wall's"), A("Type","Chocolate Bar"), A("Coating","Milk Chocolate")),
          Tags("chocobar","feast","kwality","icecream"),
          Imgs("1472","1473","1474")),

        P(cat, "Naturals Ice Cream Sitaphal", "naturals-ice-cream-sitaphal",
          "Naturals premium Sitaphal (custard apple) ice cream with real fruit pulp — no artificial colours or flavours. A Bombay icon.",
          Vs(V("500ml", 229, null, 25)),
          As(A("Brand","Naturals"), A("Flavour","Sitaphal / Custard Apple"), A("No Artificial Colours","Yes")),
          Tags("icecream","naturals","sitaphal","premium"),
          Imgs("1475","1476","1477")),
    ];

    private static List<Product> BuildBreakfastCerealsProducts(Category cat) =>
    [
        P(cat, "Kellogg's Corn Flakes Original", "kelloggs-corn-flakes-original",
          "Kellogg's Corn Flakes made from golden corn are a classic breakfast cereal fortified with iron and vitamins. Light, crispy and ready in seconds.",
          Vs(V("250g", 159, 169, 70), V("475g", 279, 299, 45), V("875g", 479, 519, 22)),
          As(A("Brand","Kellogg's"), A("Type","Original"), A("Iron Fortified","Yes")),
          Tags("cornflakes","kelloggs","breakfast","cereal"),
          Imgs("1500","1501","1502")),

        P(cat, "Kellogg's Chocos", "kelloggs-chocos",
          "Kellogg's Chocos chocolate-coated wheat balls turn milk chocolatey and are fortified with vitamins and minerals. A kids' breakfast favourite.",
          Vs(V("250g", 169, 179, 60), V("415g", 269, 289, 35)),
          As(A("Brand","Kellogg's"), A("Flavour","Chocolate"), A("For","Kids")),
          Tags("chocos","kelloggs","chocolate","kids"),
          Imgs("1503","1504","1505")),

        P(cat, "Kellogg's Muesli Fruit & Nut", "kelloggs-muesli-fruit-nut",
          "Kellogg's Muesli with 25% fruits, nuts and seeds provides fibre and energy for a wholesome, fulfilling breakfast.",
          Vs(V("500g", 299, 329, 40), V("1kg", 549, 589, 20)),
          As(A("Brand","Kellogg's"), A("Type","Muesli"), A("Fruits & Nuts","25%")),
          Tags("muesli","kelloggs","fruit","nut"),
          Imgs("1506","1507","1508")),

        P(cat, "Quaker Oats Original", "quaker-oats-original",
          "Quaker 100% whole grain rolled oats are a hearty, fibre-rich breakfast that cooks in 3 minutes. No added sugar or salt.",
          Vs(V("500g", 149, null, 80), V("1kg", 269, null, 50), V("2kg", 499, null, 25)),
          As(A("Brand","Quaker"), A("Type","Rolled Oats"), A("Cook Time","3 minutes")),
          Tags("oats","quaker","original","healthy"),
          Imgs("1509","1510","1511")),

        P(cat, "Quaker Oats Masala", "quaker-oats-masala",
          "Quaker Savory Masala Oats is a quick, filling breakfast with Indian spices and vegetable pieces — ready in 3 minutes.",
          Vs(V("400g", 149, null, 70), V("800g", 269, null, 35)),
          As(A("Brand","Quaker"), A("Flavour","Masala"), A("Cook Time","3 minutes")),
          Tags("oats","quaker","masala","indian"),
          Imgs("1512","1513","1514")),

        P(cat, "Saffola Oats", "saffola-oats",
          "Saffola 100% natural oats with beta-glucan fibre help reduce cholesterol. Heart-healthy and filling for an active lifestyle.",
          Vs(V("400g", 139, null, 70), V("1kg", 299, null, 40)),
          As(A("Brand","Saffola"), A("Key Nutrient","Beta-Glucan"), A("Cholesterol","Helps reduce")),
          Tags("oats","saffola","heart","healthy"),
          Imgs("1515","1516","1517")),

        P(cat, "Bagrry's Corn Flakes", "bagrrys-corn-flakes",
          "Bagrry's natural corn flakes with no added sugar are a light, crispy breakfast cereal rich in fibre and B vitamins.",
          Vs(V("800g", 249, 269, 40), V("1.5kg", 429, 459, 20)),
          As(A("Brand","Bagrry's"), A("No Added Sugar","Yes"), A("Fibre Rich","Yes")),
          Tags("cornflakes","bagrrys","natural","fiber"),
          Imgs("1518","1519","1520")),

        P(cat, "Yoga Bar Muesli Dark Choco", "yoga-bar-muesli-dark-choco",
          "Yoga Bar Dark Chocolate Muesli with oats, nuts, seeds and dark chocolate chunks is a high-protein, nutritious breakfast.",
          Vs(V("400g", 299, 329, 35), V("700g", 499, 549, 18)),
          As(A("Brand","Yoga Bar"), A("Type","Dark Chocolate Muesli"), A("Protein","High")),
          Tags("muesli","yogabar","chocolate","granola"),
          Imgs("1521","1522","1523")),

        P(cat, "Britannia Good Day Butter Biscuits", "britannia-good-day-butter-biscuits",
          "Britannia Good Day butter cookies baked with real butter deliver a rich, crumbly texture and classic buttery taste.",
          Vs(V("100g", 20, null, 200), V("200g", 35, null, 150), V("600g", 99, null, 70)),
          As(A("Brand","Britannia"), A("Type","Butter Cookie"), A("Real Butter","Yes")),
          Tags("biscuits","goodday","butter","britannia"),
          Imgs("1524","1525","1526")),

        P(cat, "Parle-G Biscuit Pack", "parle-g-biscuit-pack",
          "Parle-G glucose biscuits in a family-size pack — India's favourite chai-time biscuit since 1939. Wholesome and affordable.",
          Vs(V("100g", 10, null, 300), V("400g", 35, null, 200), V("800g", 65, null, 100)),
          As(A("Brand","Parle"), A("Type","Glucose Biscuit"), A("Classic","Yes")),
          Tags("parleg","biscuit","classic","chai"),
          Imgs("1527","1528","1529")),

        P(cat, "McVitie's Digestive Biscuits", "mcvities-digestive-biscuits",
          "McVitie's Digestive semi-sweet wheatmeal biscuits are a classic British biscuit with a high fibre content. Perfect with tea.",
          Vs(V("250g", 89, null, 70), V("500g", 159, 169, 40)),
          As(A("Brand","McVitie's"), A("Type","Digestive"), A("Wheat","Wholegrain")),
          Tags("digestive","mcvities","biscuit","wheat"),
          Imgs("1530","1531","1532")),

        P(cat, "Oreo Original Cream Cookies", "oreo-original-cream-cookies",
          "Oreo Original with a classic chocolate wafer and sweet cream filling — the world's most loved cookie. Twist, lick and dunk!",
          Vs(V("120g", 50, null, 150), V("300g", 109, 119, 80)),
          As(A("Brand","Oreo"), A("Type","Sandwich Cookie"), A("Filling","Vanilla Cream")),
          Tags("oreo","cookies","chocolate","cream"),
          Imgs("1533","1534","1535")),

        P(cat, "Sunfeast Dark Fantasy Choco Fills", "sunfeast-dark-fantasy-choco-fills",
          "Sunfeast Dark Fantasy Choco Fills with a velvety chocolate cream filling inside a crispy biscuit shell — indulgent and delicious.",
          Vs(V("75g", 30, null, 150), V("300g", 109, 119, 70)),
          As(A("Brand","Sunfeast"), A("Type","Choco Fill"), A("Filling","Chocolate Cream")),
          Tags("darkfantasy","sunfeast","chocolate","fills"),
          Imgs("1536","1537","1538")),

        P(cat, "Britannia Brown Bread Loaf", "britannia-brown-bread-loaf",
          "Britannia whole wheat brown bread with added fibre and vitamins is a healthy daily bread alternative. Soft and freshly baked.",
          Vs(V("400g", 45, null, 100), V("600g", 65, null, 70)),
          As(A("Brand","Britannia"), A("Type","Brown Bread"), A("Whole Wheat","Yes")),
          Tags("brownbread","britannia","whole","wheat"),
          Imgs("1539","1540","1541")),

        P(cat, "English Oven White Bread", "english-oven-white-bread",
          "English Oven enriched white sandwich bread is extra soft and perfect for morning toast, sandwiches and rolls.",
          Vs(V("400g", 40, null, 100), V("800g", 75, null, 60)),
          As(A("Brand","English Oven"), A("Type","White Bread"), A("Soft","Yes")),
          Tags("whitebread","englishoven","sandwich","soft"),
          Imgs("1542","1543","1544")),

        P(cat, "Harvest Gold Multigrain Bread", "harvest-gold-multigrain-bread",
          "Harvest Gold Multigrain bread with 5 wholesome grains provides more fibre and protein than regular white bread.",
          Vs(V("400g", 55, null, 80), V("800g", 99, null, 50)),
          As(A("Brand","Harvest Gold"), A("Grains","5 grain blend"), A("High Fibre","Yes")),
          Tags("multigrain","bread","harvest","healthy"),
          Imgs("1545","1546","1547")),

        P(cat, "Kissan Mixed Fruit Jam", "kissan-mixed-fruit-jam",
          "Kissan Mixed Fruit Jam is India's most loved jam made from real fruit pulp and bursting with natural fruit flavours.",
          Vs(V("200g", 89, null, 80), V("500g", 189, 199, 45)),
          As(A("Brand","Kissan"), A("Flavour","Mixed Fruit"), A("Real Fruit","Yes")),
          Tags("jam","kissan","fruit","spread"),
          Imgs("1548","1549","1550")),

        P(cat, "Nutella Hazelnut Spread", "nutella-hazelnut-spread",
          "Nutella hazelnut spread with cocoa is made from quality hazelnuts and fine cocoa — a delicious spread the whole family loves.",
          Vs(V("200g", 279, 299, 40), V("400g", 499, 549, 20)),
          As(A("Brand","Nutella"), A("Key Ingredients","Hazelnuts, Cocoa"), A("Vegetarian","Yes")),
          Tags("nutella","chocolate","hazelnut","spread"),
          Imgs("1551","1552","1553")),

        P(cat, "Amul Butter Salted", "amul-butter-salted-spread",
          "Amul Pasteurised Salted Table Butter is perfect for toast, sandwiches and baking. Made from fresh cream with a classic taste.",
          Vs(V("100g", 55, null, 100), V("500g", 249, null, 50)),
          As(A("Brand","Amul"), A("Type","Salted Table Butter"), A("Fat","80%")),
          Tags("butter","amul","salted","spread"),
          Imgs("1554","1555","1556")),

        P(cat, "Dr. Oetker Peanut Butter Crunchy", "dr-oetker-peanut-butter-crunchy",
          "Dr. Oetker FunFoods Peanut Butter Crunchy is made from 90% roasted peanuts with no hydrogenated fats. High protein, no added cholesterol.",
          Vs(V("340g", 249, 269, 40), V("600g", 399, 429, 20)),
          As(A("Brand","Dr. Oetker"), A("Type","Crunchy"), A("Peanuts","90%")),
          Tags("peanutbutter","crunchy","protein","spread"),
          Imgs("1557","1558","1559")),

        P(cat, "Maggi 2-Minute Noodles Masala", "maggi-2-minute-noodles-masala",
          "Maggi Masala Noodles with the iconic tastemaker blend is a quick and comforting meal ready in just 2 minutes. India's favourite.",
          Vs(V("70g", 14, null, 300), V("4×70g", 54, null, 150), V("12×70g", 149, null, 70)),
          As(A("Brand","Nestle"), A("Cook Time","2 minutes"), A("Type","Instant Noodles")),
          Tags("maggi","noodles","masala","instant"),
          Imgs("1560","1561","1562")),

        P(cat, "Yippee Magic Masala Noodles", "yippee-magic-masala-noodles",
          "ITC Yippee Magic Masala noodles with a round, non-sticky noodle cake and a zingy masala packet. Long, slurpy noodles.",
          Vs(V("65g", 13, null, 250), V("4×65g", 50, null, 100)),
          As(A("Brand","ITC Sunfeast"), A("Type","Instant Noodles"), A("Shape","Round Cake")),
          Tags("yippee","noodles","masala","sunfeast"),
          Imgs("1563","1564","1565")),

        P(cat, "Top Ramen Curry Noodles", "top-ramen-curry-noodles",
          "Top Ramen Curry instant noodles with a flavourful curry masala packet are a quick and satisfying meal anytime.",
          Vs(V("70g", 14, null, 200), V("4×70g", 52, null, 80)),
          As(A("Brand","Nissin"), A("Flavour","Curry"), A("Type","Instant Noodles")),
          Tags("topramen","noodles","curry","instant"),
          Imgs("1566","1567","1568")),

        P(cat, "Horlicks Original Malt", "horlicks-original-malt",
          "Horlicks Original malt-based health drink fortified with 23 vital nutrients supports growth, immunity and energy in children.",
          Vs(V("200g", 139, 149, 60), V("500g", 299, 329, 35), V("1kg", 549, 589, 18)),
          As(A("Brand","Horlicks"), A("Nutrients","23 vital"), A("For","Children")),
          Tags("horlicks","health","drink","malt"),
          Imgs("1569","1570","1571")),

        P(cat, "Complan Chocolate Health Drink", "complan-chocolate-health-drink",
          "Complan Chocolate with 34 nutrients including 100% milk protein and DHA supports brain development and height in growing kids.",
          Vs(V("200g", 149, 159, 55), V("500g", 329, 349, 28)),
          As(A("Brand","Complan"), A("Nutrients","34"), A("Key Nutrient","DHA")),
          Tags("complan","chocolate","growth","health"),
          Imgs("1572","1573","1574")),

        P(cat, "Bournvita Health Drink", "bournvita-health-drink",
          "Cadbury Bournvita with the goodness of cocoa and enriched with vitamins and minerals supports strength and immunity. Loved for 70+ years.",
          Vs(V("200g", 109, null, 80), V("500g", 239, null, 50), V("1kg", 449, null, 25)),
          As(A("Brand","Cadbury"), A("Flavour","Chocolate Malt"), A("Key Benefit","Strength & Immunity")),
          Tags("bournvita","chocolate","cadbury","health"),
          Imgs("1575","1576","1577")),

        P(cat, "Ovaltine Malt Drink", "ovaltine-malt-drink",
          "Ovaltine cocoa malt drink with a blend of vitamins and minerals boosts energy and provides complete daily nutrition.",
          Vs(V("400g", 299, 329, 35), V("800g", 549, 589, 18)),
          As(A("Brand","Ovaltine"), A("Type","Malt Cocoa"), A("With Vitamins","Yes")),
          Tags("ovaltine","malt","cocoa","health"),
          Imgs("1578","1579","1580")),
    ];

    private static List<Product> BuildElectronicsProducts(Category cat) =>
    [
        P(cat, "boAt Bassheads 100 Earphones", "boat-bassheads-100-earphones",
          "boAt BassHeads 100 wired earphones deliver powerful bass with a 10mm driver and in-line microphone. Universal 3.5mm jack.",
          Vs(V("1 pc Black", 299, 329, 50), V("1 pc Blue", 299, 329, 50)),
          As(A("Brand","boAt"), A("Type","Wired"), A("Driver","10mm"), A("Mic","In-line")),
          Tags("earphones","boat","bassheads","wired"),
          Imgs("1600","1601","1602")),

        P(cat, "boAt Airdopes 141 TWS", "boat-airdopes-141-tws",
          "boAt Airdopes 141 true wireless earbuds with Beast Mode for low latency gaming and 42-hour total playback. IPX4 water-resistant.",
          Vs(V("1 pc Black", 1299, 1399, 30), V("1 pc White", 1299, 1399, 25)),
          As(A("Brand","boAt"), A("Type","TWS"), A("Playback","42 hours total"), A("IPX","4")),
          Tags("tws","earbuds","boat","wireless"),
          Imgs("1603","1604","1605")),

        P(cat, "Realme Buds T100 TWS", "realme-buds-t100-tws",
          "Realme Buds T100 TWS earbuds with AI ENC noise cancellation for calls and 28-hour total battery. Comfortable in-ear fit.",
          Vs(V("1 pc Black", 1299, 1399, 30), V("1 pc Blue", 1299, 1399, 25)),
          As(A("Brand","Realme"), A("Type","TWS"), A("ENC","AI Noise Cancellation"), A("Battery","28 hours total")),
          Tags("tws","realme","buds","wireless"),
          Imgs("1606","1607","1608")),

        P(cat, "JBL C100SI Earphones", "jbl-c100si-earphones",
          "JBL C100SI wired earphones with JBL Pure Bass sound and one-button remote with mic. Flat tangle-free cable.",
          Vs(V("1 pc Black", 499, 549, 45), V("1 pc Blue", 499, 549, 40)),
          As(A("Brand","JBL"), A("Type","Wired"), A("Signature Sound","JBL Pure Bass")),
          Tags("earphones","jbl","wired","bass"),
          Imgs("1609","1610","1611")),

        P(cat, "Sony MDR-ZX110 Headphones", "sony-mdr-zx110-headphones",
          "Sony MDR-ZX110 lightweight over-ear headphones with 30mm driver deliver clear, detailed sound. Foldable for portability.",
          Vs(V("1 pc Black", 899, 999, 30), V("1 pc White", 899, 999, 25)),
          As(A("Brand","Sony"), A("Type","Over-Ear Wired"), A("Driver","30mm"), A("Foldable","Yes")),
          Tags("headphones","sony","over-ear","wired"),
          Imgs("1612","1613","1614")),

        P(cat, "Syska 18W Fast Charger", "syska-18w-fast-charger",
          "Syska 18W Quick Charge 3.0 fast charger with USB-C port charges compatible phones up to 4x faster than standard chargers.",
          Vs(V("1 pc White", 299, 329, 50), V("1 pc Black", 299, 329, 45)),
          As(A("Brand","Syska"), A("Power","18W"), A("Standard","Quick Charge 3.0"), A("Port","USB-C")),
          Tags("charger","syska","fast","18w"),
          Imgs("1615","1616","1617")),

        P(cat, "Ambrane 20W PD Charger", "ambrane-20w-pd-charger",
          "Ambrane 20W Power Delivery charger with USB-C port supports fast charging for iPhones and Android devices.",
          Vs(V("1 pc", 349, 379, 40), V("2 pcs", 649, 699, 20)),
          As(A("Brand","Ambrane"), A("Power","20W"), A("Standard","Power Delivery"), A("Port","USB-C")),
          Tags("charger","ambrane","20w","pd"),
          Imgs("1618","1619","1620")),

        P(cat, "Belkin 65W GaN Charger", "belkin-65w-gan-charger",
          "Belkin BoostCharge Pro 65W GaN 3-port wall charger charges a laptop, phone and tablet simultaneously. Compact and intelligent.",
          Vs(V("1 pc", 1999, 2199, 15)),
          As(A("Brand","Belkin"), A("Power","65W"), A("Technology","GaN"), A("Ports","3")),
          Tags("charger","belkin","65w","gan"),
          Imgs("1621","1622","1623")),

        P(cat, "Anker PowerCore 10000 Powerbank", "anker-powercore-10000-powerbank",
          "Anker PowerCore 10000 compact power bank with high-speed charging technology recharges most phones 2.5 times. Ultra-slim design.",
          Vs(V("1 pc Black", 1299, 1399, 30), V("1 pc White", 1299, 1399, 25)),
          As(A("Brand","Anker"), A("Capacity","10000mAh"), A("Output","12W")),
          Tags("powerbank","anker","10000mah","portable"),
          Imgs("1624","1625","1626")),

        P(cat, "Mi 10000mAh Powerbank", "mi-10000mah-powerbank",
          "Mi 10000mAh Power Bank 3i with dual USB output and 18W fast charging input recharges quickly and charges two devices at once.",
          Vs(V("1 pc Black", 799, 849, 40), V("1 pc Blue", 799, 849, 35)),
          As(A("Brand","Xiaomi"), A("Capacity","10000mAh"), A("Fast Charge","18W input")),
          Tags("powerbank","mi","10000","xiaomi"),
          Imgs("1627","1628","1629")),

        P(cat, "USB-C to USB-C Cable", "usbc-to-usbc-cable",
          "Braided USB-C to USB-C cable supports fast charging up to 60W and fast data transfer at 480 Mbps. Tangle-free and durable.",
          Vs(V("1m", 199, 219, 70), V("2m", 299, 329, 40)),
          As(A("Type","USB-C to USB-C"), A("Charging","60W"), A("Data Transfer","480Mbps")),
          Tags("cable","usbc","charging","data"),
          Imgs("1630","1631","1632")),

        P(cat, "Lightning Cable 1m MFi Certified", "lightning-cable-1m-mfi",
          "Apple MFi Certified lightning cable for iPhones and iPads with nylon braided jacket. Fast charging at 18W.",
          Vs(V("1m", 249, 269, 60), V("2m", 349, 379, 35)),
          As(A("Type","Lightning"), A("MFi Certified","Yes"), A("Material","Braided Nylon")),
          Tags("cable","lightning","iphone","mfi"),
          Imgs("1633","1634","1635")),

        P(cat, "Micro USB Cable 1m", "micro-usb-cable-1m",
          "Durable micro USB charging and data cable compatible with Android phones, tablets, cameras and more. Supports fast charging.",
          Vs(V("1m", 99, null, 100), V("2m", 149, null, 60)),
          As(A("Type","Micro USB"), A("Compatible","Android, Cameras, Tablets")),
          Tags("cable","microusb","android","charging"),
          Imgs("1636","1637","1638")),

        P(cat, "HDMI Cable 1.5m", "hdmi-cable-1-5m",
          "HDMI 2.0 cable supports 4K @60Hz, HDR and ARC for connecting laptops and streaming devices to TVs and monitors.",
          Vs(V("1.5m", 249, 269, 50), V("3m", 349, 379, 30)),
          As(A("Type","HDMI 2.0"), A("Resolution","4K @60Hz"), A("HDR","Yes")),
          Tags("hdmi","cable","tv","laptop"),
          Imgs("1639","1640","1641")),

        P(cat, "boAt Wave Call Smartwatch", "boat-wave-call-smartwatch",
          "boAt Wave Call smartwatch with Bluetooth calling, 1.69-inch display and 100+ sports modes. 7-day battery life.",
          Vs(V("1 pc Black", 1999, 2199, 25), V("1 pc Rose Gold", 1999, 2199, 20)),
          As(A("Brand","boAt"), A("Display","1.69 inch"), A("Battery","7 days"), A("Calling","Bluetooth")),
          Tags("smartwatch","boat","wave","fitness"),
          Imgs("1642","1643","1644")),

        P(cat, "Noise ColorFit Pro 4 Smartwatch", "noise-colorfit-pro-4-watch",
          "Noise ColorFit Pro 4 AMOLED smartwatch with always-on display, 100+ sports modes, SpO2 and heart rate monitoring.",
          Vs(V("1 pc Black", 2499, 2699, 20), V("1 pc Silver", 2499, 2699, 18)),
          As(A("Brand","Noise"), A("Display","AMOLED"), A("Health","SpO2, Heart Rate")),
          Tags("smartwatch","noise","colorfit","fitness"),
          Imgs("1645","1646","1647")),

        P(cat, "Portronics Mobile Stand", "portronics-mobile-stand",
          "Portronics Muffi adjustable desk phone stand with 360° rotation holds smartphones and small tablets. Foldable and portable.",
          Vs(V("1 pc Black", 199, 219, 60), V("1 pc White", 199, 219, 55)),
          As(A("Brand","Portronics"), A("Rotation","360°"), A("Foldable","Yes")),
          Tags("mobilestand","portronics","desk","holder"),
          Imgs("1648","1649","1650")),

        P(cat, "Belkin Wireless Charger 10W", "belkin-wireless-charger-10w",
          "Belkin BoostCharge 10W Qi wireless charger with LED indicator works with all Qi-enabled devices through cases up to 3mm.",
          Vs(V("1 pc Pad", 999, 1099, 20), V("1 pc Stand", 1299, 1399, 15)),
          As(A("Brand","Belkin"), A("Power","10W"), A("Standard","Qi"), A("Through Case","Up to 3mm")),
          Tags("wirelesscharger","belkin","10w","qi"),
          Imgs("1651","1652","1653")),

        P(cat, "Wipro Smart LED Bulb 9W", "wipro-smart-led-bulb-9w",
          "Wipro 9W WiFi smart LED bulb with 16 million colours works with Alexa and Google Home. Control from anywhere via app.",
          Vs(V("1 pc", 499, 549, 30), V("2 pcs", 899, 979, 15)),
          As(A("Brand","Wipro"), A("Wattage","9W"), A("Smart","Yes"), A("Works With","Alexa, Google Home")),
          Tags("smartbulb","wipro","9w","alexa"),
          Imgs("1654","1655","1656")),

        P(cat, "Syska Smart LED Strip 5m", "syska-smart-led-strip-5m",
          "Syska 5m RGB smart LED strip with WiFi control and 16 million colours. Create ambience, sync with music via app.",
          Vs(V("1 pc", 799, 879, 20), V("2 pcs", 1499, 1649, 10)),
          As(A("Brand","Syska"), A("Length","5m"), A("Colors","16 million RGB"), A("WiFi","Yes")),
          Tags("ledstrip","syska","smart","rgb"),
          Imgs("1657","1658","1659")),

        P(cat, "Mi Smart Plug", "mi-smart-plug",
          "Mi Smart Plug converts any socket into a smart socket — control appliances remotely via app, schedule and monitor energy usage.",
          Vs(V("1 pc", 499, 549, 30), V("2 pcs", 899, 979, 15)),
          As(A("Brand","Xiaomi"), A("Type","Smart Plug"), A("Works With","Alexa, Google Home")),
          Tags("smartplug","mi","wifi","automation"),
          Imgs("1660","1661","1662")),

        P(cat, "Logitech M185 Wireless Mouse", "logitech-m185-wireless-mouse",
          "Logitech M185 wireless mouse with nano USB receiver and 12-month battery life. Smooth 1000 DPI tracking on most surfaces.",
          Vs(V("1 pc Black", 799, 879, 30), V("1 pc Red", 799, 879, 25)),
          As(A("Brand","Logitech"), A("DPI","1000"), A("Battery","12 months"), A("Receiver","Nano USB")),
          Tags("mouse","logitech","wireless","m185"),
          Imgs("1663","1664","1665")),

        P(cat, "Portronics USB Hub 4-Port", "portronics-usb-hub-4-port",
          "Portronics Mport 4-port USB hub expands laptop connectivity. USB 3.0 version delivers data transfer at 5 Gbps.",
          Vs(V("1 pc USB 2.0", 299, 329, 40), V("1 pc USB 3.0", 499, 549, 25)),
          As(A("Brand","Portronics"), A("Ports","4"), A("USB 3.0","5 Gbps")),
          Tags("usbhub","portronics","4port","laptop"),
          Imgs("1666","1667","1668")),

        P(cat, "Screen Cleaning Kit", "screen-cleaning-kit",
          "Professional microfibre screen cleaning kit with cleaning solution and lint-free cloth safely cleans laptops, phones and monitors.",
          Vs(V("Standard Kit", 199, 219, 50), V("Pro Kit", 299, 329, 30)),
          As(A("Includes","Spray + Cloth"), A("Safe For","All Screens"), A("Streak Free","Yes")),
          Tags("screencleaner","kit","laptop","phone"),
          Imgs("1669","1670","1671")),

        P(cat, "Tempered Glass Screen Guard", "tempered-glass-screen-guard",
          "Premium 9H tempered glass screen protector with bubble-free installation. 0.33mm thin with oleophobic coating to prevent fingerprints.",
          Vs(V("1 pc Universal 6.5\"", 99, null, 100), V("2 pcs", 169, null, 60)),
          As(A("Hardness","9H"), A("Thickness","0.33mm"), A("Coating","Oleophobic")),
          Tags("screenguard","tempered","glass","protection"),
          Imgs("1672","1673","1674")),

        P(cat, "Phone Back Cover Universal", "phone-back-cover-universal",
          "Flexible TPU back cover provides drop protection and a grippy feel. Universal fit works with most 6-6.7 inch smartphones.",
          Vs(V("1 pc Clear", 99, null, 100), V("1 pc Black", 149, null, 80)),
          As(A("Material","TPU"), A("Fit","6 – 6.7 inch"), A("Drop Protection","Yes")),
          Tags("phonecover","back","universal","silicone"),
          Imgs("1675","1676","1677")),
    ];

    private static List<Product> BuildMasalaOilProducts(Category cat) =>
    [
        P(cat, "Fortune Sunflower Oil", "fortune-sunflower-oil",
          "Fortune Refined Sunflower Oil is light, clear and rich in Vitamin E — ideal for everyday Indian cooking and deep frying.",
          Vs(V("1L", 149, null, 80), V("2L", 279, null, 55), V("5L", 649, null, 25)),
          As(A("Brand","Fortune"), A("Type","Refined"), A("Vitamin E","Rich")),
          Tags("sunfloweroil","fortune","cooking","refined"),
          Imgs("1700","1701","1702")),

        P(cat, "Saffola Gold Oil", "saffola-gold-oil",
          "Saffola Gold dual seed technology blended oil with rice bran and sunflower oil helps maintain healthy cholesterol levels.",
          Vs(V("1L", 179, null, 70), V("2L", 329, null, 45), V("5L", 769, null, 20)),
          As(A("Brand","Saffola"), A("Type","Blended Oil"), A("Heart","Helps maintain cholesterol")),
          Tags("saffolaoil","heart","refined","blended"),
          Imgs("1703","1704","1705")),

        P(cat, "Dhara Mustard Oil", "dhara-mustard-oil",
          "Dhara Kachi Ghani Pure Mustard Oil cold-pressed from premium mustard seeds delivers authentic pungency for North Indian and Bengali cooking.",
          Vs(V("1L", 159, null, 80), V("2L", 299, null, 50), V("5L", 719, null, 20)),
          As(A("Brand","Dhara"), A("Type","Kachi Ghani"), A("Cold Pressed","Yes")),
          Tags("mustardoil","dhara","kachi","ghani"),
          Imgs("1706","1707","1708")),

        P(cat, "Patanjali Mustard Oil", "patanjali-mustard-oil",
          "Patanjali Kachi Ghani Mustard Oil is pure, cold-pressed and free from adulterants, preserving natural nutrients and aroma.",
          Vs(V("1L", 149, null, 80), V("2L", 279, null, 50)),
          As(A("Brand","Patanjali"), A("Type","Kachi Ghani"), A("Pure","Yes")),
          Tags("mustardoil","patanjali","kachi","pure"),
          Imgs("1709","1710","1711")),

        P(cat, "Nutralite Olive Oil", "nutralite-olive-oil",
          "Nutralite Extra Light Olive Oil has a light taste ideal for salad dressings, sautéing and baking. Rich in healthy monounsaturated fats.",
          Vs(V("250ml", 299, 329, 40), V("500ml", 549, 589, 20)),
          As(A("Brand","Nutralite"), A("Type","Extra Light"), A("Fats","Monounsaturated")),
          Tags("oliveoil","extra","light","healthy"),
          Imgs("1712","1713","1714")),

        P(cat, "Amul Pure Ghee Tin", "amul-ghee-tin",
          "Amul Pure Cow Ghee tin with a rich aroma and classic grainy texture. Made from 100% fresh cream for authentic traditional flavour.",
          Vs(V("200ml", 179, null, 70), V("500ml", 399, null, 45), V("1L", 749, null, 20)),
          As(A("Brand","Amul"), A("Type","Pure Cow Ghee"), A("Texture","Grainy")),
          Tags("ghee","amul","pure","cow"),
          Imgs("1715","1716","1717")),

        P(cat, "Everest Garam Masala", "everest-garam-masala",
          "Everest Garam Masala is a balanced blend of premium whole spices ground to perfection for rich, aromatic Indian curries.",
          Vs(V("50g", 49, null, 100), V("100g", 89, null, 70), V("200g", 159, null, 40)),
          As(A("Brand","Everest"), A("Type","Garam Masala"), A("Blend","Whole Spices")),
          Tags("garammasala","everest","spice","blend"),
          Imgs("1718","1719","1720")),

        P(cat, "MDH Chole Masala", "mdh-chole-masala",
          "MDH Chole Masala with a perfect blend of 15 aromatic spices gives Punjabi chole an authentic, rich flavour.",
          Vs(V("100g", 89, null, 70), V("500g", 369, null, 25)),
          As(A("Brand","MDH"), A("Spices","15 blend"), A("Type","Chole Masala")),
          Tags("cholemasala","mdh","punjabi","spice"),
          Imgs("1721","1722","1723")),

        P(cat, "MTR Sambar Masala", "mtr-sambar-masala",
          "MTR Sambar Masala with traditional South Indian spice blending gives an authentic, restaurant-quality sambar every time.",
          Vs(V("100g", 79, null, 80), V("200g", 139, null, 50)),
          As(A("Brand","MTR"), A("Cuisine","South Indian"), A("Type","Sambar Masala")),
          Tags("sambarmasala","mtr","south","spice"),
          Imgs("1724","1725","1726")),

        P(cat, "Everest Pav Bhaji Masala", "everest-pav-bhaji-masala",
          "Everest Pav Bhaji Masala adds the unmistakable Mumbai street-food flavour to your homemade pav bhaji.",
          Vs(V("50g", 45, null, 100), V("100g", 79, null, 70)),
          As(A("Brand","Everest"), A("Cuisine","Mumbai Street Food"), A("Type","Pav Bhaji Masala")),
          Tags("pavbhajimasala","everest","mumbai","street"),
          Imgs("1727","1728","1729")),

        P(cat, "Badshah Kitchen King Masala", "badshah-kitchen-king-masala",
          "Badshah Kitchen King Masala is a versatile all-in-one spice blend that enhances any vegetable or non-veg dish.",
          Vs(V("100g", 89, null, 70), V("500g", 359, null, 25)),
          As(A("Brand","Badshah"), A("Type","All-Purpose Masala"), A("Versatile","Yes")),
          Tags("kitchenking","badshah","masala","blend"),
          Imgs("1730","1731","1732")),

        P(cat, "Catch Turmeric Powder", "catch-turmeric-powder",
          "Catch pure turmeric powder with high curcumin content adds vibrant colour and anti-inflammatory benefits to every dish.",
          Vs(V("100g", 49, null, 100), V("200g", 89, null, 70), V("500g", 189, null, 35)),
          As(A("Brand","Catch"), A("Type","Turmeric"), A("Curcumin","High")),
          Tags("turmeric","haldi","catch","spice"),
          Imgs("1733","1734","1735")),

        P(cat, "Catch Red Chilli Powder", "catch-red-chilli-powder",
          "Catch pure red chilli powder made from premium quality dried red chillies with consistent heat and deep red colour.",
          Vs(V("100g", 55, null, 100), V("200g", 99, null, 70), V("500g", 219, null, 35)),
          As(A("Brand","Catch"), A("Heat Level","Medium-Hot"), A("Pure","Yes")),
          Tags("chillipowder","catch","red","spice"),
          Imgs("1736","1737","1738")),

        P(cat, "Everest Coriander Powder", "everest-coriander-powder",
          "Everest Dhania Powder made from carefully selected coriander seeds adds a citrusy, earthy flavour to curries and dals.",
          Vs(V("100g", 49, null, 100), V("200g", 85, null, 60)),
          As(A("Brand","Everest"), A("Type","Coriander Powder"), A("Pure","Yes")),
          Tags("coriander","dhania","powder","spice"),
          Imgs("1739","1740","1741")),

        P(cat, "MDH Jeera Whole", "mdh-jeera-whole",
          "MDH premium whole cumin seeds with an intense earthy aroma are essential for tadka, biryanis and everyday Indian cooking.",
          Vs(V("100g", 79, null, 80), V("200g", 139, null, 50)),
          As(A("Brand","MDH"), A("Type","Whole Cumin"), A("Grade","Premium")),
          Tags("jeera","cumin","whole","spice"),
          Imgs("1742","1743","1744")),

        P(cat, "Catch Black Pepper Powder", "catch-black-pepper-powder",
          "Catch pure black pepper powder finely ground from mature Malabar peppercorns. Adds heat and depth to any cuisine.",
          Vs(V("50g", 79, null, 80), V("100g", 149, null, 50)),
          As(A("Brand","Catch"), A("Type","Black Pepper"), A("Origin","Malabar")),
          Tags("blackpepper","powder","catch","spice"),
          Imgs("1745","1746","1747")),

        P(cat, "Tata Salt Iodized", "tata-salt-iodized",
          "Tata Salt is India's most trusted iodized vacuum evaporated salt with uniform grain size and consistent purity.",
          Vs(V("1kg", 25, null, 200), V("2kg", 45, null, 100)),
          As(A("Brand","Tata Salt"), A("Type","Iodized"), A("Process","Vacuum Evaporated")),
          Tags("salt","tata","iodized","kitchen"),
          Imgs("1748","1749","1750")),

        P(cat, "Catch Rock Salt Sendha Namak", "catch-rock-salt-sendha-namak",
          "Catch Sendha Namak pure Himalayan rock salt used for fasting and everyday cooking. Naturally mineral-rich and unrefined.",
          Vs(V("500g", 49, null, 100), V("1kg", 89, null, 60)),
          As(A("Brand","Catch"), A("Type","Sendha Namak / Rock Salt"), A("Natural","Yes")),
          Tags("rocksalt","sendha","namak","vrat"),
          Imgs("1751","1752","1753")),

        P(cat, "Sugar Free Natura", "sugar-free-natura",
          "Sugar Free Natura aspartame sweetener tablets are zero calorie and ideal for people with diabetes or those watching sugar intake.",
          Vs(V("100 tabs", 99, null, 70), V("300 tabs", 249, null, 35)),
          As(A("Brand","Sugar Free"), A("Type","Aspartame"), A("Calories","Zero")),
          Tags("sugarfree","natura","sweetener","diabetic"),
          Imgs("1754","1755","1756")),

        P(cat, "India Gate Basmati Rice", "india-gate-basmati-rice",
          "India Gate Classic Basmati Rice with extra-long grains and a rich aroma is perfect for biryani and pulao.",
          Vs(V("1kg", 119, null, 80), V("5kg", 549, null, 30)),
          As(A("Brand","India Gate"), A("Type","Classic Basmati"), A("Grain","Extra Long")),
          Tags("basmati","indiagate","rice","biryani"),
          Imgs("1757","1758","1759")),

        P(cat, "Daawat Rozana Basmati Rice", "daawat-rozana-basmati",
          "Daawat Rozana everyday basmati rice is aged for optimal texture and grain length — perfectly fluffy every time.",
          Vs(V("1kg", 99, null, 80), V("5kg", 459, null, 30)),
          As(A("Brand","Daawat"), A("Type","Rozana Basmati"), A("Aged","Yes")),
          Tags("basmati","daawat","rozana","rice"),
          Imgs("1760","1761","1762")),

        P(cat, "Aashirvaad Whole Wheat Atta", "aashirvaad-whole-wheat-atta",
          "Aashirvaad Whole Wheat Atta made from 100% whole grain wheat retains the fibre and nutrients of the bran and germ.",
          Vs(V("1kg", 65, null, 100), V("5kg", 289, null, 50), V("10kg", 559, null, 20)),
          As(A("Brand","Aashirvaad"), A("Type","Whole Wheat"), A("Fibre","High")),
          Tags("atta","aashirvaad","wholewheat","flour"),
          Imgs("1763","1764","1765")),

        P(cat, "Pillsbury Chakki Fresh Atta", "pillsbury-chakki-fresh-atta",
          "Pillsbury Chakki Fresh Atta stone-ground from premium wheat retains natural goodness and makes soft, fluffy rotis.",
          Vs(V("1kg", 60, null, 100), V("5kg", 269, null, 50)),
          As(A("Brand","Pillsbury"), A("Type","Chakki Atta"), A("Stone Ground","Yes")),
          Tags("atta","pillsbury","chakki","flour"),
          Imgs("1766","1767","1768")),

        P(cat, "Tata Sampann Chana Dal", "tata-sampann-chana-dal",
          "Tata Sampann unpolished Chana Dal retains natural goodness and protein. Thick, creamy dal that cooks evenly.",
          Vs(V("500g", 75, null, 80), V("1kg", 139, null, 50)),
          As(A("Brand","Tata Sampann"), A("Type","Chana Dal"), A("Polished","Unpolished")),
          Tags("chanadal","tata","sampann","pulse"),
          Imgs("1769","1770","1771")),

        P(cat, "Tata Sampann Moong Dal", "tata-sampann-moong-dal",
          "Tata Sampann unpolished Moong Dal is rich in protein and fibre, ideal for everyday dal, khichdi and soups.",
          Vs(V("500g", 89, null, 70), V("1kg", 169, null, 40)),
          As(A("Brand","Tata Sampann"), A("Type","Moong Dal"), A("Polished","Unpolished")),
          Tags("moongdal","tata","sampann","pulse"),
          Imgs("1772","1773","1774")),

        P(cat, "Rajdhani Rajma", "rajdhani-rajma",
          "Rajdhani Kashmiri Rajma (kidney beans) are large, creamy-red beans that cook into a rich, thick gravy. Classic Punjabi dish ingredient.",
          Vs(V("500g", 89, null, 70), V("1kg", 169, null, 40)),
          As(A("Brand","Rajdhani"), A("Type","Kashmiri Rajma"), A("Protein","High")),
          Tags("rajma","kidney","beans","curry"),
          Imgs("1775","1776","1777")),

        P(cat, "24 Mantra Organic Toor Dal", "24-mantra-organic-toor-dal",
          "24 Mantra Organic Toor Dal is grown without pesticides and certified organic, with a rich, earthy flavour for everyday sambar and dal.",
          Vs(V("500g", 109, null, 60), V("1kg", 199, null, 35)),
          As(A("Brand","24 Mantra"), A("Type","Toor Dal"), A("Certified","Organic")),
          Tags("toordal","organic","24mantra","arhar"),
          Imgs("1778","1779","1780")),

        P(cat, "Catch Saunf Fennel Seeds", "catch-saunf-fennel-seeds",
          "Catch premium Saunf (fennel seeds) have a sweet, anise-like aroma used in cooking, as a mouth freshener and in digestive preparations.",
          Vs(V("100g", 45, null, 100), V("200g", 79, null, 60)),
          As(A("Brand","Catch"), A("Type","Fennel Seeds"), A("Use","Cooking & Mouth Freshener")),
          Tags("saunf","fennel","seeds","mouth-freshener"),
          Imgs("1781","1782","1783")),
    ];

    /// <summary>
    /// Data-fix: ensures every non-deleted, active product has at least one active variant.
    /// Called on every startup after seeding has already occurred (the else branch in Program.cs).
    /// Any product found with zero active variants gets a synthetic "default" variant derived
    /// from its first ProductImage URL so the Angular ADD button always has something to work with.
    /// </summary>
    public static async Task FixZeroVariantProductsAsync(BlinkitDbContext db)
    {
        var broken = await db.Products
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted && p.IsActive && !p.Variants.Any(v => v.IsActive))
            .ToListAsync();

        if (broken.Count == 0)
            return;

        foreach (var product in broken)
        {
            var imageUrl = product.Images
                .OrderBy(i => i.DisplayOrder)
                .FirstOrDefault()?.ImageUrl ?? string.Empty;

            var defaultVariant = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Unit = "1 pc",
                Price = 29m,
                DiscountPrice = null,
                StockQty = 50,
                ImageUrl = imageUrl,
                DisplayOrder = 0,
                IsActive = true,
            };

            await db.ProductVariants.AddAsync(defaultVariant);
        }

        await db.SaveChangesAsync();
    }

    public static async Task FixInvertedPricesAsync(BlinkitDbContext db)
    {
        var invertedVariants = await db.ProductVariants
            .Where(v => v.DiscountPrice != null && v.DiscountPrice > v.Price)
            .ToListAsync();

        if (invertedVariants.Count == 0)
            return;

        foreach (var variant in invertedVariants)
        {
            var temp = variant.Price;
            variant.Price = variant.DiscountPrice.Value;
            variant.DiscountPrice = temp;
        }

        await db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Category Cat(string name, string slug, string iconUrl, int order) =>
        new() { Id = Guid.NewGuid(), Name = name, Slug = slug, IconUrl = iconUrl, DisplayOrder = order };

    private static Product P(
        Category category,
        string name,
        string slug,
        string description,
        List<ProductVariant> variants,
        List<ProductAttribute> attributes,
        List<ProductTag> tags,
        List<ProductImage> images)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Name = name,
            Slug = slug,
            Description = description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        foreach (var v in variants)   { v.ProductId = product.Id; }
        foreach (var a in attributes) { a.ProductId = product.Id; }
        foreach (var t in tags)       { t.ProductId = product.Id; }
        foreach (var i in images)     { i.ProductId = product.Id; }
        product.Variants   = variants;
        product.Attributes = attributes;
        product.Tags       = tags;
        product.Images     = images;
        return product;
    }

    private static List<ProductVariant> Vs(params ProductVariant[] variants) => [.. variants];

    private static ProductVariant V(string unit, decimal price, decimal? discountPrice, int stock, int order = 0) =>
        new()
        {
            Id = Guid.NewGuid(),
            Unit = unit,
            Price = discountPrice ?? price,
            DiscountPrice = discountPrice.HasValue ? price : null,
            StockQty = stock,
            ImageUrl = string.Empty,
            DisplayOrder = order
        };

    private static List<ProductAttribute> As(params ProductAttribute[] attrs) => [.. attrs];

    private static ProductAttribute A(string key, string value, int order = 0) =>
        new() { Id = Guid.NewGuid(), Key = key, Value = value, DisplayOrder = order };

    private static List<ProductTag> Tags(params string[] tags) =>
        tags.Select(t => new ProductTag { Id = Guid.NewGuid(), Tag = t }).ToList();

    private static List<ProductImage> Imgs(params string[] ids) =>
        ids.Select((id, i) => new ProductImage { Id = Guid.NewGuid(), ImageUrl = Img(id), DisplayOrder = i }).ToList();
}
