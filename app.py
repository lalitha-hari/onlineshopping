from flask import Flask, render_template, request, jsonify
import psycopg2
from psycopg2 import sql

app = Flask(__name__)

# Connect to PostgreSQL database
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="onlineshopping",  # Change to your database name
            user="postgres",          # Change to your username
            password="lalithahari",   # Change to your password
            host="localhost",
            port="5432"               # Default PostgreSQL port
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

# Route to display all products
@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM Products;')  # Ensure the Products table exists in your DB
            products = cur.fetchall()

        # Returning products as a list of dictionaries for better JSON structure
        product_list = []
        for product in products:
            product_list.append({
                'product_id': product[0],
                'product_name': product[1],
                'price': product[2],
                'stock': product[3],
                'image_link': product[4]  # Assuming this column exists in the Products table
            })
        
        return jsonify(product_list)
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({"message": "Error fetching products"}), 500
    finally:
        conn.close()

# Route to handle purchasing a product (Buy Now)
@app.route('/buy/<int:product_id>', methods=['POST'])
def buy_product(product_id):
    try:
        # Connect to the DB and check the stock
        conn = get_db_connection()
        if conn is None:
            return jsonify({"message": "Database connection failed"}), 500

        with conn.cursor() as cur:
            # Get the current stock of the product
            cur.execute('SELECT stock FROM Products WHERE product_id = %s;', (product_id,))
            product_stock = cur.fetchone()

            if not product_stock or product_stock[0] <= 0:
                return jsonify({"success": False, "message": "Product is out of stock!"}), 400

            # Reduce the stock by 1 (for a single purchase)
            new_stock = product_stock[0] - 1
            cur.execute('UPDATE Products SET stock = %s WHERE product_id = %s;', (new_stock, product_id))

            # Optionally, add purchase record to an Orders table (if you wish)
            # cur.execute(
            #     'INSERT INTO Orders (product_id, quantity) VALUES (%s, 1)',
            #     (product_id,)
            # )

        conn.commit()
        return jsonify({"success": True, "new_stock": new_stock})

    except Exception as e:
        print(f"Error purchasing product: {e}")
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        if conn:
            conn.close()

# Route to place an order
@app.route('/order', methods=['POST'])
def place_order():
    try:
        customer_id = request.form['customer_id']
        product_id = request.form['product_id']
        quantity = int(request.form['quantity'])

        if quantity <= 0:
            return jsonify({"message": "Invalid quantity!"}), 400

        # Connect to the DB and process the order
        conn = get_db_connection()
        if conn is None:
            return jsonify({"message": "Database connection failed"}), 500

        with conn.cursor() as cur:
            # Check if enough stock is available for the product
            cur.execute('SELECT stock FROM Products WHERE product_id = %s;', (product_id,))
            product_stock = cur.fetchone()

            if not product_stock or product_stock[0] < quantity:
                return jsonify({"message": "Not enough stock available!"}), 400

            # Insert the order into the Orders table
            cur.execute(
                'INSERT INTO Orders (customer_id, product_id, quantity) VALUES (%s, %s, %s)',
                (customer_id, product_id, quantity)
            )

            # Update the stock in the Products table
            cur.execute(
                'UPDATE Products SET stock = stock - %s WHERE product_id = %s;',
                (quantity, product_id)
            )

        conn.commit()

        return jsonify({"message": "Order placed successfully!"})

    except Exception as e:
        print(f"Error placing order: {e}")
        return jsonify({"message": f"An error occurred: {e}"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)
