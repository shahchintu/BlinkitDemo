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

        // MORE CATEGORIES TO BE ADDED
        // (meat-fish, personal-care, household, baby-care, pet-care,
        //  pharma, beauty, frozen-foods, breakfast-cereals, electronics)

        await db.Products.AddRangeAsync(products);
        await db.SaveChangesAsync();
    }

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
        new() { Id = Guid.NewGuid(), Unit = unit, Price = price, DiscountPrice = discountPrice, StockQty = stock, ImageUrl = string.Empty, DisplayOrder = order };

    private static List<ProductAttribute> As(params ProductAttribute[] attrs) => [.. attrs];

    private static ProductAttribute A(string key, string value, int order = 0) =>
        new() { Id = Guid.NewGuid(), Key = key, Value = value, DisplayOrder = order };

    private static List<ProductTag> Tags(params string[] tags) =>
        tags.Select(t => new ProductTag { Id = Guid.NewGuid(), Tag = t }).ToList();

    private static List<ProductImage> Imgs(params string[] ids) =>
        ids.Select((id, i) => new ProductImage { Id = Guid.NewGuid(), ImageUrl = Img(id), DisplayOrder = i }).ToList();
}
