document.addEventListener('DOMContentLoaded', function () {
    let cart = [];

    // Fetch products from the backend
    fetch('/products')
        .then(response => response.json())
        .then(products => {
            const productsDiv = document.getElementById('products');
            products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('product-card');
                productDiv.innerHTML = `
                    <img src="${product.image_link}" alt="${product.product_name}">
                    <h2>${product.product_name}</h2>
                    <p>Price: $${product.price}</p>
                    <p>Stock: <span id="stock-${product.product_id}">${product.stock}</span></p>
                    <button onclick="buyProduct(${product.product_id}, ${product.stock})">Buy Now</button>
                    <button onclick="addToCart(${product.product_id}, '${product.product_name}', ${product.price}, ${product.stock}, '${product.image_link}')">Add to Cart</button>
                `;
                productsDiv.appendChild(productDiv);
            });
        })
        .catch(error => console.error('Error fetching products:', error));

    // Handle Buy Now button click
    window.buyProduct = function (productId, currentStock) {
        if (currentStock <= 0) {
            alert("Sorry, this product is out of stock!");
            return;
        }

        fetch(`/buy/${productId}`, {
            method: 'POST',
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const stockElement = document.getElementById(`stock-${productId}`);
                    stockElement.textContent = data.new_stock;
                    alert("Product purchased successfully!");
                } else {
                    alert("Not enough stock!");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("There was an issue purchasing the product.");
            });
    };

    // Handle Add to Cart button click
    window.addToCart = function (productId, productName, price, stock, imageLink) {
        if (!cart.some(item => item.productId === productId)) {
            cart.push({ productId, productName, price, stock, imageLink });
            updateCartCount();  // Update the cart count
            updateCartModal();  // Update the cart modal content
        } else {
            alert("This product is already in your cart!");
        }
    };

    // Update cart count
    function updateCartCount() {
        document.getElementById('cartCount').textContent = cart.length;
    }

    // Toggle Cart Modal visibility
    window.toggleCart = function () {
        const cartModal = document.getElementById('cartModal');
        if (cartModal.style.display === 'block') {
            cartModal.style.display = 'none';
        } else {
            cartModal.style.display = 'block';
        }
    };

    // Update Cart Modal content
    function updateCartModal() {
        const cartItemsList = document.getElementById('cartItems');
        cartItemsList.innerHTML = ''; // Clear existing items

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<li>Your cart is empty.</li>'; // Ensure "Your cart is empty" appears only once
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('li');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <img src="${item.imageLink}" alt="${item.productName}" style="width: 50px; height: 50px; margin-right: 10px;">
                    <span>Product Name: ${item.productName}</span><br>
                    <span>Price: $${item.price}</span><br>
                    <span>Stock: ${item.stock}</span>
                `;
                cartItemsList.appendChild(cartItem);
            });
        }
    }

    // Handle Order Form submission
    document.getElementById('orderForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const customerId = document.getElementById('customer_id').value;
        const productId = document.getElementById('product_id').value;
        const quantity = document.getElementById('quantity').value;

        fetch('/place_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_id: customerId,
                product_id: productId,
                quantity: quantity,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showOrderConfirmation();
                } else {
                    alert("There was an error placing your order.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error placing order.");
            });
    });

    // Show Order Confirmation Modal
    function showOrderConfirmation() {
        document.getElementById('orderConfirmationModal').style.display = 'block';
    }

    // Close Modal
    window.closeModal = function () {
        document.getElementById('orderConfirmationModal').style.display = 'none';
    };
});
