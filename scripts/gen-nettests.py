import os
import pystache
# pip install https://github.com/okunishinishi/python-stringcase/archive/cc7d5eb58ff4a959a508c3f2296459daf7c3a1f2.zip
import stringcase

PKG_TMPL = """
{
  "name": "ooni-{{nettest_dash_case}}",
  "version": "0.3.0",
  "description": "Official OONI test for running {{nettest_name}}",
  "dependencies": {
    "measurement-kit": "0.1.0"
  }
}
"""

INDEX_TMPL = """
import { {{nettest_pascal_case}} } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    Cli.log(Cli.output.labelValue('Label', uploadMbit, {unit: 'Mbit'}))
  } else if (React) {
    /*
    XXX this is broken currently as it depends on react
    const {
      Container,
      Heading
    } = Components
    return class extends React.Component {
      render() {
        return <Container>
          <Heading h={1}>Results for NDT</Heading>
          {uploadMbit}
        </Container>
      }
    }
    */
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
})

export const run = ({ooni, argv}) => {
  const {{nettest_camel_case}} = {{nettest_pascal_case}}(ooni.mkOptions)
  ooni.init({{nettest_camel_case}})

  {{nettest_camel_case}}.on('begin', () => ooni.onProgress(0.0, 'starting {{nettest_dash_case}}'))
  {{nettest_camel_case}}.on('progress', (percent, message) => {
    ooni.onProgress(percent, message, persist)
  })
  return ooni.run({{nettest_camel_case}}.run)
}
"""

nettests = [
    ['Web Connectivity', 'web-connectivity'],
    ['HTTP Invalid Request Line', 'http-invalid-request-line'],
    ['HTTP Header Field Manipulation', 'http-header-field-manipulation'],
    #['NDT', 'ndt'],
    ['Dash', 'dash'],
    ['Facebook Messenger', 'facebook-messenger'],
    ['Telegram', 'telegram'],
    ['WhatsApp', 'whatsapp']
]

def gen():
    for nettest_name, nettest_dash_case in nettests:
        nettest_camel_case = stringcase.camelcase(nettest_dash_case)
        nettest_pascal_case = stringcase.pascalcase(nettest_dash_case)
        partials = dict(
            nettest_dash_case=nettest_dash_case,
            nettest_camel_case=nettest_camel_case,
            nettest_pascal_case=nettest_pascal_case,
            nettest_name=nettest_name
        )
        dst_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'nettests', nettest_dash_case)
        if not os.path.exists(dst_path):
            os.mkdir(dst_path)

        index_path = os.path.join(dst_path, 'index.js')
        package_path = os.path.join(dst_path, 'package.json')
        with open(index_path, 'w+') as out_file:
            out_file.write(pystache.render(INDEX_TMPL, partials))
        print('wrote {}'.format(index_path))
        with open(package_path, 'w+') as out_file:
            out_file.write(pystache.render(PKG_TMPL, partials))
        print('wrote {}'.format(package_path))

def main():
    gen()

if __name__ == '__main__':
    main()
