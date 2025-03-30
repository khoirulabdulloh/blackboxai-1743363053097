// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const purchaseForm = document.getElementById('purchaseForm');
    const itemsList = document.getElementById('itemsList');
    const filterMonth = document.getElementById('filterMonth');
    const sortByMonthBtn = document.getElementById('sortByMonth');
    const totalPriceElement = document.getElementById('totalPrice');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEdit');

    // Initialize purchases array from localStorage or empty array
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];

    // Set current month as default for purchase date
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    document.getElementById('purchaseDate').value = currentMonth;
    filterMonth.value = currentMonth;

    // Render initial list
    renderPurchases();
    updateTotalPrice();

    // Event Listeners
    purchaseForm.addEventListener('submit', handleAddPurchase);
    filterMonth.addEventListener('change', filterByMonth);
    sortByMonthBtn.addEventListener('click', sortPurchasesByMonth);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', handleEditPurchase);

    // Functions
    function handleAddPurchase(e) {
        e.preventDefault();
        
        // Get form values
        const newPurchase = {
            id: Date.now().toString(),
            itemName: document.getElementById('itemName').value,
            itemType: document.getElementById('itemType').value,
            itemBrand: document.getElementById('itemBrand').value,
            itemDetails: document.getElementById('itemDetails').value,
            itemCategory: document.getElementById('itemCategory').value,
            itemPrice: parseFloat(document.getElementById('itemPrice').value),
            itemCurrency: document.getElementById('itemCurrency').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            itemStatus: document.getElementById('itemStatus').value,
            marketplaceLink: document.getElementById('marketplaceLink').value,
            createdAt: new Date().toISOString()
        };

        // Add to purchases array
        purchases.push(newPurchase);
        
        // Save to localStorage
        savePurchases();
        
        // Reset form
        purchaseForm.reset();
        document.getElementById('purchaseDate').value = currentMonth;
        
        // Re-render list
        renderPurchases();
        updateTotalPrice();
    }

    function renderPurchases(purchasesToRender = purchases) {
        if (purchasesToRender.length === 0) {
            itemsList.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                    <i class="fas fa-shopping-cart text-4xl mb-2"></i>
                    <p>No purchases found</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = purchasesToRender.map(purchase => `
            <div class="bg-white p-4 rounded-lg shadow-md" data-id="${purchase.id}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-semibold text-lg">${purchase.itemName}</h3>
                        <p class="text-gray-600 text-sm">${formatDate(purchase.purchaseDate)}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-btn text-blue-600 hover:text-blue-800" data-id="${purchase.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn text-red-600 hover:text-red-800" data-id="${purchase.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                        <p class="text-sm text-gray-500">Type</p>
                        <p>${purchase.itemType || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Brand</p>
                        <p>${purchase.itemBrand || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Details</p>
                        <p>${purchase.itemDetails || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Category</p>
                        <p>${purchase.itemCategory}</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-500">Status</p>
                            <p class="font-medium ${getStatusColor(purchase.itemStatus)}">${purchase.itemStatus}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Price</p>
                            <p class="font-semibold">${formatCurrency(purchase.itemPrice, purchase.itemCurrency)}</p>
                        </div>
                    </div>
                    ${purchase.marketplaceLink ? `
                    <div class="mt-2">
                        <a href="${purchase.marketplaceLink}" target="_blank" class="text-blue-600 hover:underline text-sm">
                            <i class="fas fa-external-link-alt mr-1"></i> Marketplace Link
                        </a>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openEditModal(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deletePurchase(id);
            });
        });
    }

    function openEditModal(id) {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;

        // Fill the edit form with purchase data
        document.getElementById('editItemId').value = purchase.id;
        document.getElementById('editItemName').value = purchase.itemName;
        document.getElementById('editItemType').value = purchase.itemType;
        document.getElementById('editItemBrand').value = purchase.itemBrand;
        document.getElementById('editItemDetails').value = purchase.itemDetails;
        document.getElementById('editItemCategory').value = purchase.itemCategory;
        document.getElementById('editItemPrice').value = purchase.itemPrice;
        document.getElementById('editItemCurrency').value = purchase.itemCurrency;
        document.getElementById('editPurchaseDate').value = purchase.purchaseDate;
        document.getElementById('editItemStatus').value = purchase.itemStatus;
        document.getElementById('editMarketplaceLink').value = purchase.marketplaceLink || '';

        // Show the modal
        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    function handleEditPurchase(e) {
        e.preventDefault();
        
        const id = document.getElementById('editItemId').value;
        const purchaseIndex = purchases.findIndex(p => p.id === id);
        
        if (purchaseIndex === -1) return;
        
        // Update the purchase
        purchases[purchaseIndex] = {
            ...purchases[purchaseIndex],
            itemName: document.getElementById('editItemName').value,
            itemType: document.getElementById('editItemType').value,
            itemBrand: document.getElementById('editItemBrand').value,
            itemDetails: document.getElementById('editItemDetails').value,
            itemCategory: document.getElementById('editItemCategory').value,
            itemPrice: parseFloat(document.getElementById('editItemPrice').value),
            itemCurrency: document.getElementById('editItemCurrency').value,
            purchaseDate: document.getElementById('editPurchaseDate').value,
            itemStatus: document.getElementById('editItemStatus').value,
            marketplaceLink: document.getElementById('editMarketplaceLink').value
        };
        
        // Save to localStorage
        savePurchases();
        
        // Close modal and re-render
        closeEditModal();
        renderPurchases();
        updateTotalPrice();
    }

    function deletePurchase(id) {
        if (!confirm('Are you sure you want to delete this purchase?')) return;
        
        purchases = purchases.filter(purchase => purchase.id !== id);
        savePurchases();
        renderPurchases();
        updateTotalPrice();
    }

    function filterByMonth() {
        const selectedMonth = filterMonth.value;
        if (!selectedMonth) {
            renderPurchases();
            updateTotalPrice();
            return;
        }
        
        const filteredPurchases = purchases.filter(purchase => 
            purchase.purchaseDate.startsWith(selectedMonth)
        );
        
        renderPurchases(filteredPurchases);
        updateTotalPrice(filteredPurchases);
    }

    function sortPurchasesByMonth() {
        const sortedPurchases = [...purchases].sort((a, b) => {
            return new Date(b.purchaseDate) - new Date(a.purchaseDate);
        });
        
        renderPurchases(sortedPurchases);
    }

    function updateTotalPrice(purchasesToCalculate = purchases) {
        const selectedMonth = filterMonth.value;
        let filteredPurchases = purchasesToCalculate;
        
        if (selectedMonth) {
            filteredPurchases = purchasesToCalculate.filter(purchase => 
                purchase.purchaseDate.startsWith(selectedMonth)
            );
        }
        
        const total = filteredPurchases.reduce((sum, purchase) => sum + purchase.itemPrice, 0);
        totalPriceElement.textContent = formatCurrency(total, filteredPurchases[0]?.itemCurrency || '$');
    }

    function savePurchases() {
        localStorage.setItem('purchases', JSON.stringify(purchases));
    }

    // Helper functions
    function formatDate(dateString) {
        const [year, month] = dateString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function formatCurrency(amount, currency) {
        if (currency === '$') return `$${amount.toFixed(2)}`;
        if (currency === 'AED') return `${amount.toFixed(2)} د.إ`;
        if (currency === 'IDR') return `Rp${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        return `${currency}${amount.toFixed(2)}`;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Arrived': return 'text-green-600';
            case 'Shipping': return 'text-yellow-600';
            case 'Checkout': return 'text-blue-600';
            case 'Chart': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    }
});