using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Blinkit.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDarkStoresAndOrderTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DarkStores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Lat = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: false),
                    Lng = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DarkStores", x => x.Id);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "DarkStoreId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryPartnerName",
                table: "Orders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryPartnerPhone",
                table: "Orders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryPartnerLat",
                table: "Orders",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryPartnerLng",
                table: "Orders",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDeliveryMinutes",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
                INSERT INTO DarkStores (Id, Name, Address, City, Lat, Lng, IsActive) VALUES
                ('a1000000-0000-0000-0000-000000000001', 'Blinkit Store - Satellite',      'Satellite Road, Ahmedabad',    'Ahmedabad', 23.0225000, 72.5714000, 1),
                ('a1000000-0000-0000-0000-000000000002', 'Blinkit Store - Andheri',         'Andheri West, Mumbai',          'Mumbai',    19.1136000, 72.8697000, 1),
                ('a1000000-0000-0000-0000-000000000003', 'Blinkit Store - Koramangala',     'Koramangala, Bangalore',        'Bangalore', 12.9352000, 77.6245000, 1),
                ('a1000000-0000-0000-0000-000000000004', 'Blinkit Store - Connaught Place', 'Connaught Place, Delhi',        'Delhi',     28.6315000, 77.2167000, 1),
                ('a1000000-0000-0000-0000-000000000005', 'Blinkit Store - Hitech City',     'Hitech City, Hyderabad',        'Hyderabad', 17.4474000, 78.3762000, 1);
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DarkStoreId",
                table: "Orders",
                column: "DarkStoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_DarkStores_DarkStoreId",
                table: "Orders",
                column: "DarkStoreId",
                principalTable: "DarkStores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_DarkStores_DarkStoreId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_DarkStoreId",
                table: "Orders");

            migrationBuilder.DropTable(name: "DarkStores");

            migrationBuilder.DropColumn(name: "DarkStoreId", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryPartnerName", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryPartnerPhone", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryPartnerLat", table: "Orders");
            migrationBuilder.DropColumn(name: "DeliveryPartnerLng", table: "Orders");
            migrationBuilder.DropColumn(name: "EstimatedDeliveryMinutes", table: "Orders");
        }
    }
}
