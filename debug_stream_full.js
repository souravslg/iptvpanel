
fetch('http://localhost:3000/api/player_api?username=tivimate_test&password=password&action=get_live_streams')
    .then(r => r.json())
    .then(data => {
        if (data.length > 0) {
            console.log('Stream ID:', data[0].stream_id);
            console.log('Direct Source:', data[0].direct_source);
            console.log('Container Ext:', data[0].container_extension);
        } else {
            console.log('No streams found');
        }
    })
    .catch(e => console.error(e));
