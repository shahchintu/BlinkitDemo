using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/pages")]
[AllowAnonymous]
public class PagesController : ControllerBase
{
    private readonly Dictionary<string, PageContent> _pages = new(StringComparer.OrdinalIgnoreCase)
    {
        {
            "about",
            new PageContent(
                "about",
                "About Blinkit Clone",
                "2025-01-01",
                new List<PageSection>
                {
                    new PageSection(
                        "Who We Are",
                        "Blinkit Clone is a showcase project built using Angular 18 and ASP.NET Core 8, demonstrating modern full-stack development with AI-assisted vibe coding via Claude Code. This project replicates the core experience of India's leading quick-commerce grocery delivery platform — delivering groceries and daily essentials in under 10 minutes."
                    ),
                    new PageSection(
                        "Our Mission",
                        "Our mission is to demonstrate how modern development tools like Claude Code can accelerate the creation of production-grade applications. This project covers everything from authentication and payments to real-time order tracking and an admin panel — all built with clean architecture and best practices."
                    ),
                    new PageSection(
                        "Technology Stack",
                        "Frontend: Angular 18, TypeScript, Tailwind CSS, Angular Material, NgRx Signals. Backend: ASP.NET Core 8, Clean Architecture, Entity Framework Core 8, SQL Server, Redis. Payments: Razorpay integration. Email: Resend for transactional emails. AI: Claude Code for development assistance."
                    ),
                    new PageSection(
                        "The Story",
                        "This project was built as a vibe coding showcase — using AI prompts to generate, review, and refine code phase by phase. Starting from a blank folder, the complete Blinkit clone was built in under 10 days, covering 8 major phases from infrastructure to deployment."
                    ),
                    new PageSection(
                        "Our Values",
                        "Speed: Deliver features fast without compromising quality. Quality: Every component follows TypeScript strict mode and Clean Architecture. Innovation: Embrace AI-driven development workflows. Learning: Share knowledge through open-source."
                    )
                }
            )
        },
        {
            "careers",
            new PageContent(
                "careers",
                "Careers at Blinkit Clone",
                "2025-01-01",
                new List<PageSection>
                {
                    new PageSection(
                        "Join Our Team",
                        "We are always looking for talented developers, designers, and product thinkers who are passionate about building fast, reliable, and user-friendly applications. While this is a demo project, we believe in showcasing what great engineering culture looks like."
                    ),
                    new PageSection(
                        "Open Positions",
                        """
                        Senior Full-Stack Developer (.NET + Angular)
                        Location: Remote | Experience: 5+ years
                        We are looking for engineers who can build scalable APIs with ASP.NET Core and beautiful UIs with Angular.

                        Frontend Engineer (Angular 18)
                        Location: Remote | Experience: 3+ years
                        Build pixel-perfect, performant Angular components using Tailwind CSS and NgRx Signals.

                        DevOps Engineer (Azure)
                        Location: Remote | Experience: 4+ years
                        Manage Azure Container Apps, SQL Server, Redis, and GitHub Actions CI/CD pipelines.

                        Product Manager
                        Location: Remote | Experience: 3+ years
                        Define product roadmaps and work closely with engineering to ship features fast.
                        """
                    ),
                    new PageSection(
                        "Why Work With Us",
                        "Cutting-edge Tech Stack: Work with the latest Angular 18, .NET 8, and AI development tools. Remote First: Work from anywhere in India or globally. Learning Culture: We invest in your growth with learning budgets and conference attendance. Fast Delivery: Ship features in days, not months. Open Source: Contribute to projects used by thousands."
                    ),
                    new PageSection(
                        "How to Apply",
                        "Send your resume and a brief cover letter explaining why you want to join us to careers@blinkitclone.com. Include links to your GitHub profile or any projects you are proud of. We review every application within 5 business days."
                    )
                }
            )
        },
        {
            "press",
            new PageContent(
                "press",
                "Press & Media",
                "2025-01-01",
                new List<PageSection>
                {
                    new PageSection(
                        "About This Project",
                        "Blinkit Clone is a fully functional quick-commerce grocery delivery application built as a vibe coding showcase using Claude Code by Anthropic. The project demonstrates that AI-assisted development can produce production-grade, enterprise-quality applications in record time."
                    ),
                    new PageSection(
                        "Key Facts",
                        """
                        Built in: Under 10 days using AI-assisted development.
                        Tech Stack: Angular 18 + ASP.NET Core 8 + SQL Server + Redis.
                        Products: 500+ real Indian grocery products across 15 categories.
                        Features: Razorpay payments, email confirmations, order tracking, admin panel, live location detection.
                        AI Tool: Claude Code by Anthropic.
                        Architecture: Clean Architecture with CQRS pattern.
                        """
                    ),
                    new PageSection(
                        "Media Coverage",
                        "This project has been used as a demonstration of AI-driven development capabilities, showcasing how modern tools like Claude Code can help developers build complex full-stack applications faster without compromising on code quality or architecture standards."
                    ),
                    new PageSection(
                        "Press Kit",
                        "For press inquiries, interviews, or to request our press kit including screenshots, architecture diagrams, and project statistics, please contact us at press@blinkitclone.com. We are happy to provide demos, technical walkthroughs, and interviews about the development process."
                    ),
                    new PageSection(
                        "Awards & Recognition",
                        """
                        Best Demo Project — Internal Tech Showcase 2025.
                        Most Complete Blinkit Replica — Developer Community.
                        Recognized for Clean Architecture Implementation.
                        Featured in AI Development Showcase Series.
                        """
                    )
                }
            )
        },
        {
            "blog",
            new PageContent(
                "blog",
                "Blog",
                "2025-01-01",
                new List<PageSection>
                {
                    new PageSection(
                        "Building a Blinkit Clone in 10 Days with Claude Code",
                        "In this post we walk through how we built a complete Blinkit clone — India's leading quick-commerce app — in just 10 days using Claude Code by Anthropic. We cover the architecture decisions, challenges faced, and how AI-assisted development changed our workflow. Published: May 2025."
                    ),
                    new PageSection(
                        "Clean Architecture in ASP.NET Core 8 — A Practical Guide",
                        "Clean Architecture is not just a buzzword — it is a proven approach to building maintainable, testable, and scalable applications. In this post we explain how we implemented Clean Architecture across 4 layers: Domain, Application, Infrastructure, and API. Published: April 2025."
                    ),
                    new PageSection(
                        "NgRx Signals — The Future of State Management in Angular 18",
                        "NgRx Signals represents a major shift in how we manage state in Angular applications. Unlike traditional NgRx with actions and reducers, Signals offer a simpler, more reactive approach. We used NgRx Signals throughout this project for AuthStore, CartStore, and product state. Published: March 2025."
                    ),
                    new PageSection(
                        "Integrating Razorpay with .NET 8 — A Complete Guide",
                        "Razorpay is India's leading payment gateway and integrating it with .NET 8 is straightforward once you understand the flow. In this guide we cover creating orders, handling the payment modal, verifying HMAC-SHA256 signatures, and processing webhooks securely. Published: February 2025."
                    ),
                    new PageSection(
                        "Redis for Cart Management — Why and How",
                        "Storing cart data in Redis instead of SQL gives us sub-millisecond reads, automatic TTL-based expiry, and easy horizontal scaling. We explain our Redis cart implementation with JSON serialization, 7-day TTL, and SQL Server fallback for reliability. Published: January 2025."
                    )
                }
            )
        },
        {
            "contact",
            new PageContent(
                "contact",
                "Contact Us",
                "2025-01-01",
                new List<PageSection>
                {
                    new PageSection(
                        "Get in Touch",
                        "We would love to hear from you — whether you have a question about the project, want to report a bug, suggest a feature, or discuss collaboration opportunities."
                    ),
                    new PageSection(
                        "Email Us",
                        """
                        General Inquiries: hello@blinkitclone.com
                        Technical Support: support@blinkitclone.com
                        Business & Partnerships: business@blinkitclone.com
                        Press & Media: press@blinkitclone.com
                        Careers: careers@blinkitclone.com
                        """
                    ),
                    new PageSection(
                        "Developer",
                        """
                        This project was built and maintained by a full-stack .NET developer with 10+ years of experience. Built using Angular 18, ASP.NET Core 8, and Claude Code AI development assistance.
                        GitHub: github.com/shahchintu/BlinkitDemo
                        Location: Ahmedabad, Gujarat, India
                        """
                    ),
                    new PageSection(
                        "Response Time",
                        "We typically respond to all emails within 24-48 business hours. For urgent technical issues, please use the GitHub Issues section of our repository for faster response."
                    ),
                    new PageSection(
                        "Office Address",
                        """
                        Blinkit Clone Project
                        Ahmedabad, Gujarat - 380001
                        India
                        Note: This is a demo project. Physical visits are not applicable.
                        """
                    )
                }
            )
        },
        {
            "privacy",
            new PageContent(
                "privacy",
                "Privacy Policy",
                "January 1, 2025",
                new List<PageSection>
                {
                    new PageSection(
                        "Introduction",
                        "Blinkit Clone ('we', 'our', or 'us') is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our demonstration application. Please read this policy carefully. By using the application, you agree to the terms of this Privacy Policy."
                    ),
                    new PageSection(
                        "Information We Collect",
                        """
                        Personal Information: When you register, we collect your name, email address, and phone number.
                        Location Data: We collect your location (GPS or pincode) to show relevant products and delivery availability in your area.
                        Order Information: We collect order details including items purchased, delivery address, and payment information processed securely through Razorpay.
                        Usage Data: We collect information about how you interact with the application including pages visited and features used.
                        """
                    ),
                    new PageSection(
                        "How We Use Your Information",
                        """
                        To provide and maintain our service including processing orders and deliveries.
                        To send order confirmation and status update emails through our email service provider.
                        To improve our application based on usage patterns.
                        To communicate with you about your orders, account, and promotions.
                        To comply with legal obligations.
                        We do not sell your personal information to third parties.
                        """
                    ),
                    new PageSection(
                        "Data Storage & Security",
                        "Your data is stored securely in SQL Server databases hosted locally for this demonstration. Cart data is stored in Redis with a 7-day TTL. Access tokens are stored in memory only — never in localStorage. Refresh tokens are stored in httpOnly cookies to prevent XSS attacks. Passwords are hashed using BCrypt with salt. Payment information is processed by Razorpay and we do not store card details."
                    ),
                    new PageSection(
                        "Cookies",
                        """
                        We use the following cookies:
                        Refresh Token Cookie: httpOnly, Secure, SameSite=Strict.
                        This cookie is used to maintain your login session across page reloads. It expires after 7 days.
                        We do not use tracking cookies or advertising cookies. This is a demo application with no third-party advertising or analytics tracking.
                        """
                    ),
                    new PageSection(
                        "Your Rights",
                        "You have the right to access the personal data we hold about you. You can request correction of inaccurate data through your Account settings. You can delete your account and all associated data by contacting us. You can opt out of promotional emails at any time. For any privacy requests, contact us at privacy@blinkitclone.com."
                    ),
                    new PageSection(
                        "Third Party Services",
                        """
                        Razorpay: We use Razorpay for payment processing. Your payment data is subject to Razorpay's Privacy Policy.
                        Resend: We use Resend for transactional emails. Your email address is shared with Resend solely for sending order notifications.
                        OpenStreetMap Nominatim: We use this free service for reverse geocoding your location to a city name. No personal data is stored by this service.
                        """
                    ),
                    new PageSection(
                        "Changes to This Policy",
                        "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last Updated' date. You are advised to review this policy periodically."
                    ),
                    new PageSection(
                        "Contact",
                        "For privacy-related questions or requests, please contact us at privacy@blinkitclone.com. We will respond within 30 days."
                    )
                }
            )
        },
        {
            "terms",
            new PageContent(
                "terms",
                "Terms and Conditions",
                "January 1, 2025",
                new List<PageSection>
                {
                    new PageSection(
                        "Acceptance of Terms",
                        "By accessing or using Blinkit Clone ('the Application'), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Application. These terms apply to all visitors, users, and others who access or use the Application."
                    ),
                    new PageSection(
                        "About This Application",
                        "Blinkit Clone is a demonstration project that replicates the functionality of a quick-commerce grocery delivery application. This application is built for educational and showcase purposes using Angular 18, ASP.NET Core 8, and AI-assisted development. It is not affiliated with Blinkit (Grofers India Pvt Ltd) or Zomato Ltd."
                    ),
                    new PageSection(
                        "User Accounts",
                        "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others or use another person's account. We reserve the right to terminate accounts that violate these terms or are used for fraudulent purposes. You must be at least 18 years old to create an account."
                    ),
                    new PageSection(
                        "Orders & Payments",
                        "All orders placed through the Application are subject to availability. Prices displayed are in Indian Rupees (INR) and are inclusive of all applicable taxes. Payments are processed securely through Razorpay in test mode for this demonstration. No real money is charged. Order confirmation emails are sent to your registered email address. We reserve the right to cancel orders in case of pricing errors or stock unavailability."
                    ),
                    new PageSection(
                        "Delivery Policy",
                        "Delivery times are estimated and may vary based on location, traffic, and availability. The 8-10 minute delivery promise is a target for demonstration purposes. Delivery is free for orders above ₹199. A delivery fee of ₹29 applies for orders below ₹199. Blinkit Plus subscribers enjoy free delivery on all orders."
                    ),
                    new PageSection(
                        "Cancellations & Refunds",
                        "Orders can be cancelled before they reach the Packed status. To cancel, contact support immediately after placing the order. Refunds for cancelled orders will be processed within 5-7 business days to the original payment method. For damaged or incorrect items, please contact support within 24 hours of delivery with photos. Perishable items cannot be returned unless damaged."
                    ),
                    new PageSection(
                        "Intellectual Property",
                        "This project is built for demonstration purposes. The Blinkit name, logo, and brand are trademarks of Grofers India Pvt Ltd (Zomato). This demo project is not affiliated with or endorsed by Blinkit or Zomato. The source code of this demonstration project is available on GitHub and is intended for educational purposes. All product names and brands mentioned are trademarks of their respective owners."
                    ),
                    new PageSection(
                        "Limitation of Liability",
                        "This is a demonstration application. We are not liable for any losses arising from your use of this Application. The Application is provided 'as is' without warranties of any kind. We do not guarantee uninterrupted or error-free operation of the Application. In no event shall our liability exceed the amount paid by you through the Application in the past 30 days."
                    ),
                    new PageSection(
                        "Changes to Terms",
                        "We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Application. Your continued use of the Application after changes constitutes acceptance of the new terms. We recommend reviewing these terms periodically."
                    ),
                    new PageSection(
                        "Contact Us",
                        "For questions about these Terms and Conditions, please contact us at legal@blinkitclone.com. We will respond to all inquiries within 5 business days."
                    )
                }
            )
        }
    };

    [HttpGet("{slug}")]
    public IActionResult GetPage(string slug)
    {
        if (_pages.TryGetValue(slug.ToLower(), out var page))
            return Ok(page);
        return NotFound(new { message = $"Page '{slug}' not found" });
    }

    [HttpGet]
    public IActionResult GetAllPages()
    {
        var list = _pages.Values
            .Select(p => new { p.Slug, p.Title })
            .ToList();
        return Ok(list);
    }
}

public record PageContent(
    string Slug,
    string Title,
    string LastUpdated,
    List<PageSection> Sections);

public record PageSection(
    string Heading,
    string Content);
