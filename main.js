const apikey = '';
const area = '';
const service = 'tv';
const keywords = ['サッカーの園', '魔改造の夜', 'はなかっぱ'];

function main() {
  Logger.log('start');
  const today = new Date();
  const results = find(toDateString(today), keywords);
  Logger.log('results: ' + results.length );
  for(let result of results){
    Logger.log(result);
  }
  Logger.log('end');
}

function find(date, keywords){
  const findings = [];
  const url = `https://api.nhk.or.jp/v2/pg/list/${area}/${service}/${date}.json?key=${apikey}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());
  for(let channel in result.list){
    for(let program of result.list[channel]){
      for(let keyword of keywords){
        if(program.title.includes(keyword)){
          findings.push(getSummary(program));
        };
      }
    }
  }
  return findings;
}

function toDateString(d){
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function pad(number){
  if(number < 10){
    return '0' + number;
  }
  return number;
}

function getSummary(program){
  return {
    'id': program.id,
    'title': program.title,
    'channel': program.service.id + ':' + program.service.name,
    'start_time': program.start_time,
  }
}
