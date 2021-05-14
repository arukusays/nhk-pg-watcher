// 下記パラメータを別ファイルで定義しておく.
// const APIKEY = 'xxxxxxxxxxxxx';
// const AREA = '000';
// const SERVICE = 'tv';
// const KEYWORDS = ['サッカーの園', '魔改造の夜', 'はなかっぱ'];
// const RECIPIENT = 'xxxxxxx@gmail.com';

function main() {

  const total = {};
  for(let i = 0; i < 8; i++){
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = toDateString(date);
    try {
      const results = find(dateString, KEYWORDS);
      Logger.log(`results of ${dateString}: ${results.length}`);
      if(results.length > 0){
        total[dateString] = results;
      }
    } catch (error) {
      Logger.log(`results of ${dateString}: error -> ${error}`);
    }
  }

  Logger.log(`number of days including keywords: ${Object.keys(total).length}`);
  if(Object.keys(total).length > 0){
    let body = '';
    for(let date in total){
      body += `- ${date}: ${total[date].length} items\n`;
      total[date].forEach(program => 
        body += `  - ${program.shorten} \n`
      );
    }
    Logger.log('send email');
    const message = {
      name: 'NHK Program Watcher', // the name of the sender
      to: RECIPIENT,
      subject: 'Target Programs were found!!',
      body: body,
    };
    MailApp.sendEmail(message);
  }

}

function find(date, keywords){
  const findings = [];
  const url = `https://api.nhk.or.jp/v2/pg/list/${AREA}/${SERVICE}/${date}.json?key=${APIKEY}`;
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

function toTimeString(dateString){
  return new Date(dateString).toLocaleTimeString('ja-JP', {hour12: false});
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
    'channel': program.service.name,
    'start_time': program.start_time,
    'shorten': `${toTimeString(program.start_time)} [${program.service.name}] ${program.title}`,
  }
}
