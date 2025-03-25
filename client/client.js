const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load product.proto and discovery.proto
const PRODUCT_PROTO_PATH = path.join(__dirname, '../proto/product.proto');
const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');

const productProto = grpc.loadPackageDefinition(protoLoader.loadSync(PRODUCT_PROTO_PATH)).product;
const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

// Create a gRPC client for the DiscoveryService
const discoveryClient = new discoveryProto.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());

// Discover the address of the ProductService
function discoverProductService(callback) {
    discoveryClient.discoverService({ service_name: 'ProductService' }, (error, response) => {
        if (error) {
            console.error('Error discovering ProductService:', error.details);
            callback(null);
        } else {
            callback(response.address);
        }
    });
}

// Function to get product by ID from the ProductService
function getProductById(address, id, callback) {
    const productClient = new productProto.ProductService(address, grpc.credentials.createInsecure());
    productClient.GetProduct({ id: id }, (error, response) => {
        if (error) {
            console.error('Error fetching product:', error.details);
            callback(null);
        } else {
            callback(response);
        }
    });
}

// Function to insert a new product into the ProductService
function insertProduct(address, name, price, callback) {
    const productClient = new productProto.ProductService(address, grpc.credentials.createInsecure());
    productClient.InsertProduct({ name: name, price: price }, (error, response) => {
        if (error) {
            console.error('Error inserting product:', error.details);
            callback(null);
        } else {
            callback(response);
        }
    });
}

// Trigger the process: discover product service, get product, and insert a new product
discoverProductService((address) => {
    if (address) {
        // First, get a product by ID (for example, ID = 1)
        getProductById(address, 1, (product) => {
            if (product) {
                console.log('Product retrieved:', product);
            } else {
                console.log('Product not found');
            }

            // Now, insert a new product
            insertProduct(address, 'New Product', 29.99, (insertResponse) => {
                if (insertResponse) {
                    console.log('New product inserted:', insertResponse);
                } else {
                    console.log('Error inserting product');
                }
            });
        });
    } else {
        console.log('ProductService address not found');
    }
});
