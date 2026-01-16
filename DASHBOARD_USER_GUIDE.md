# Quick Reference Guide - MSME Dashboard Features

## 🎯 Quick Actions (Top of Dashboard)

### 1. Add Inventory Button (Indigo)
**What it does:** Opens a form to add new inventory items
**How to use:**
1. Click the "Add Inventory" button
2. Fill in the required fields:
   - Product Name (e.g., "Cotton Yarn")
   - Category (e.g., "Raw Material")
   - Stock Quantity (e.g., 1000)
   - Price per Unit (e.g., 150)
   - Unit of Measure (e.g., "Kg")
   - Minimum Stock Level (e.g., 100)
3. Optionally add a description
4. Click "Add to Inventory"
5. The item will be saved to your inventory database

### 2. New Order Button (Green)
**What it does:** Takes you to the Orders page
**How to use:**
1. Click the "New Order" button
2. You'll be redirected to the Orders view
3. From there you can manage and create new orders

### 3. Export Report Button (Blue)
**What it does:** Downloads your inventory as a CSV file
**How to use:**
1. Click the "Export Report" button
2. A CSV file will automatically download
3. The file includes:
   - Report generation date
   - Your company name
   - All inventory items with details
   - Stock status for each item
4. Open the file in Excel or Google Sheets

### 4. View Alerts Button (Orange)
**What it does:** Shows stock alerts and warnings
**How to use:**
1. Click the "View Alerts" button
2. A modal will open showing:
   - **Low Stock Items**: Products below minimum stock level (in red/yellow)
   - **Healthy Stock Items**: Count of products with sufficient stock (in green)
3. Review which items need restocking
4. Close the modal when done

## 📊 Dashboard Features

### Statistics Cards
- **Total Stock Value**: Total value of all inventory
- **Pending Orders**: Number of orders awaiting processing
- **Items in Stock**: Total quantity of all items
- **Monthly Revenue**: Revenue for the current month

### Sales Trends Graph
- Toggle between "Week" and "Month" view
- Shows actual sales data from your orders
- Hover over bars to see exact values

### Recent Activity
- Displays latest order updates
- Shows low stock alerts
- Real-time updates

### Stock Levels
- Visual representation of inventory status
- Color-coded by stock level (good/low/critical)

## 🔄 Page Persistence
**New Feature:** The dashboard now remembers your last visited page!
- If you were on the "Inventory" page and refresh, you'll stay on the Inventory page
- No more being sent back to the dashboard after every refresh
- Works for all pages: Dashboard, Inventory, Orders, Products, Issues, Profile

## 💡 Tips
1. **Regular Monitoring**: Check the "View Alerts" regularly to stay on top of low stock
2. **Export Reports**: Export your inventory weekly for backup and analysis
3. **Quick Add**: Use the "Add Inventory" button for fast inventory updates
4. **Data Accuracy**: All graphs and stats pull real data from your database

## 🐛 Troubleshooting
- **Form not submitting**: Ensure all required fields (marked with *) are filled
- **Export not working**: Check your browser's download settings
- **Graphs not showing data**: Ensure you have orders and inventory in the database
- **Page not persisting**: Clear your browser cache and try again

## 📱 Mobile Support
- All features work on mobile devices
- Use the menu button (bottom right) to access the sidebar on mobile
- Modals are scrollable on smaller screens
