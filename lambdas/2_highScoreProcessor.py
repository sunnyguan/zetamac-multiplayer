import boto3


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Game')
    high_score = table.get_item(Key={'gameId': 'record'})['Item']['score']

    response = {'update': False}
    max_score = max(event['score1'], event['score2'])
    if max_score > high_score:
        response['update'] = True
        response['score'] = max_score
        if event['score1'] > event['score2']:
            response['name'] = event['player1']
        else:
            response['name'] = event['player2']

    return response
