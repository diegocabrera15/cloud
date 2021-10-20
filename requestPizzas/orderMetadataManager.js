'use strict';

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});

module.exports.saveCompleteOrder = order =>{
    console.log('Guardar pedido fue llamado');
   
    order.delivery_status = "READY_FOR_DELIVERY"
    console.log('Guardar pedido order', order);
    const params = {
        TableName: process.env.COMPLETE_ORDER_TABLE,
        Item: order
    };
    console.log('Fin de guardado!');
    return dynamodb.put(params).promise();    
}