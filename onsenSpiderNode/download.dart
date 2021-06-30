import 'package:http/http.dart' as http;

main(List<String> args) async {
  var res = await http.get(Uri.parse('http://www.baidu.com'));
  print(res.body);
}
