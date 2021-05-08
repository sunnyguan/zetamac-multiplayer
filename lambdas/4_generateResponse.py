import json
import boto3

def lambda_handler(event, context):
    # construct http response
    responseObject = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'status': 200,
        })
    }

    return responseObject
