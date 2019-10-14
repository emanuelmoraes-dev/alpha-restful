# IMPORTANT WARNING
This version of Alpha Restful is just a prototype of things to come. Little of this package will be reused and many features will be restructured. We strongly recommend NOT to use this package for production as it will soon be completely discontinued. In the future, a completely redesigned Alpha Restful will emerge, with a completely new architecture and new functions, as well as allowing the inclusion of plugins in which any specific behavior can be replaced and new functions can be added by the community.

# Why does Alpha Restful Exist?
Alpha Restful is designed for NodeJS and MongoDB lovers.

One of MongoDB's goals is to allow data to be stored with denormalization. In turn, this yields many benefits. One of the biggest benefits of denormalization is a substantial increase in performance by not requiring the joining of multiple relational tables. In addition to this benefit, denormalization allows applications to be created easily because the storage model is too close to the model to be used by an application via JavaScript code (for example).

The advantage of denormalization is welcome for many different situations, but sometimes data needs to be normalized to avoid special updates of the same record in many different locations. Denormalization should never be treated as an absolute rule, because in many cases denormalization of all data becomes completely unfeasible.

So how do you get all the simplicity, performance and power of MongoDB in a denormalized application but with some normalized data?

MongoDB can leave application data normalized if necessary, but many simple operations in the relational model can become very difficult in MongoDB for normalized data.

Looking at this situation, how good would it be if we could develop in MongoDB so that all operations could be performed the same way, regardless of whether the data was normalized or denormalized?

What if all searches and junctions were made so that the decision to change data for normalization or denormalization didn't change, considering the searches and junctions you already implemented?

It is for these purposes that Alpha Restful was designed. If your MongoDB application never needs to normalize your data, Alpha Restful is completely useless to you.

But what would happen if in the future only specific data needed to be normalized? If you are using pure MongoDB, it is likely that all your searches involving this data will need to be redone, and depending on the type of search, the code can become very complex and you will need to merge documents.

In the scenario described earlier, if you were using Alpha Restful, you would only have to do two things. Change your template so that your data is stored normally. The second thing to do is to tell Alpha Restful where your data would be if it were denormalized. After doing these two things, the idea is that absolutely nothing needs to be done and that all the research done is not changed.

Alpha Restful currently serves many of its goals, but some details of its architecture can be problematic and some details of this structure are partially completed and many crucial features have not yet been developed. For this reason, Alpha Restful is being redrawn. The next new version of this framework will be much simpler to use and will achieve the objectives proposed here much more efficiently.

Currently, the guide written here is in Portuguese as it is a BETA version that will be discontinued. But the new version of Alpha Restful will be completely in English.

# Alpha Restful (Versão Beta)

O Alpha Restful é um framework para o desenvolvimento de aplicações web Rest backend em MongoDB, feito para Node JS. Esta ferramenta é executada em cima do Express JS e da ORM de banco de dados Mongoose.

## Atenção!

O Alpha Restful possui compatibilidade **apenas** com o **NODE 8 ou superior!**

O Alpha Restful está em versão Beta. Por causa disto, eventualmente algum erro poderá ocorrer. Caso você detecte algum erro, sinta-se livre para fazer uma publicação nas Issues do github, que eu tentarei resolver o mais rápido possível.

## Guia

Aqui será apresentado um guia para você poder já sair programando!

### Atenção

Este guia **não** engloba todas as funções implementadas pelo Alpha Restful. Em breve será disponibilizado uma documentação completa com todas as funções e opções que podem ser utilizadas!

### Instalação

#### Preparando Ambiente

* Instale o Node JS em seu computador clicando [neste link](https://nodejs.org/en/download/).

* Instale o banco de dados MongoDB em seu computador clicando [neste link](https://www.mongodb.com/download-center/community).


#### Criando Aplicação Node

Você pode criar uma nova aplicação Node através do seguinte comando:

```sh
npm init -y
```

#### Incluindo o Alpha Restful em seu Projeto

Execute o seguinte código no diretório de seu projeto

```sh
npm install alpha-restful --save
```

### Preparando o Ambiente Express JS

O Alpha Restful executa em cima do Express JS. Para mais informações sobre o Express JS, acesse o link <https://expressjs.com/>.

Se você já trabalha com o Express JS você poderá pular esta seção.

A seguir será exibido um exemplo de código que prepara o ambiente do Express JS, que poderá ser colocado no arquivo principal (primeiro script a ser executado) de sua aplicação:

```js
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
```

### Inicializando o seu Servidor

Para inicializar sua aplicação na porta _3001_, com o banco de dados no _localhost_ com o nome do banco _db_test_ e com o nome da aplicação de _aplicacao-teste_, basta acrescentar no final de seu script principal o seguinte código:

```js
const mongoose = require('mongoose') // ORM de banco de dados MongoDB
const { Connector, www, Restful, Entity } = require('alpha-restful') // Importa módulos do Alpha-Restful
const restful = new Restful('aplicacao-teste', {
  locale: 'en'
}) // Instância do Alpha Restful

// ...

process.env.PORT = 3001 // Porta do servidor
const connector = new Connector('mongodb://localhost/db_test', restful, app) // Conexão com Banco de Dados Mongo DB
www(connector, true) // Inicializia o servidor
```

O primeiro argumento do construtor de `Restful` é o nome da sua aplicação. Neste caso definiu-se o nome da aplicação de _aplicacao-teste_.

O segundo argumento deste construtor é um objeto opcional que contém várias opções. Em breve será disponibilizado uma explicação detalhada para cada opção. Umas dessas opções é a opção `locale`, que representa a linguagem na qual o banco de dados _mongodb_ irá reconhecer. Este _locale_ é utilizado para a chamada automática da função _collation_ do _mongodb_ para, por exemplo, possibilitar uma ordenação ignorando acentos e letras maiúsculas/minúsculas. Dependendo de sua versão do _mongodb_, um erro poderá ocorrer neste `collation`. Para corrigir este erro (caso ocorra), basta remover o uso do `collation` com a opção `isLocale` igual a `false`.

Caso o locale não seja definido, o padrão é o inglês (_en_). A seguir é apresentado uma tabela com todas as linguagens suportadas pelo _locale_.

Language                          | Locale
--------------------------------- | ------
Afrikaans	  	                  | af
Albanian	  	                  | sq
Amharic	  	                      | am
Armenian	  	                  | hy
Arabic	                          | ar
Assamese	  	                  | as
Azeri	                          | az
Bengali	  	                      | bn
Belarusian	                      | be
Bengali	  	                      | bn
Bosnian	                          | bs
Bosnian (Cyrillic)                | bs_Cyrl
Bulgarian	  	                  | bg
Burmese	  	                      | my
Catalan                           | ca
Cherokee	   	                  | chr
Chinese	  	                      | zh
Chinese (Traditional)             | zh_Hant
Croatian	                      | hr
Czech	   	                      | cs
Danish	                          | da
Dutch	nl	                      | nl
Dzongkha	  	                  | dz
English	                          | en
English (United States)           |	en_US
English (United States, Computer) | en_US_POSIX	 
Esperanto	  	                  | eo
Estonian	  	                  | et
Ewe	  	                          | ee
Faroese	  	                      | fo
Filipino	   	                  | fil
Finnish	     	                  | fi_FI
French	  	                      | fr
French (Canada)	    	          | fr_Ca
Galician	                      | gl
Georgian	  	                  | ka
German	  	                      | de
German (Austria)	    	      | de_AT
Greek	  	                      | rl
Gujarati	  	                  | gu
Hausa	  	                      | ha
Hawaiian	   	                  | haw
Hebrew	                          | he
Hindi	  	                      | hi
Hungarian	  	                  | hu
Icelandic	                      | is
Igbo	  	                      | ig
Inari Sami	                      | smn
Indonesian	  	                  | id
Irish	  	                      | gs
Italian	  	                      | it
Japanese                          | ja
Kalaallisut                       |	kl
Kannada	                          | kn
Kazakh	                          | kk
Khmer	                          | km
Konkani	                          | kok
Korean	                          | ko
Kyrgyz	                          | ky
Lakota	                          | lk
Lao	                              | lo
Latvian	                          | lv
Lingala	                          | li
Lithuanian                        | lt	 
Lower Sorbian                     |	dsb	 
Luxembourgish                     |	lb	 
Macedonian                        |	mk	 
Malay                             |	ms	 
Malayalam                         |	ml	 
Maltese                           |	mt	 
Marathi                           |	mr	 
Mongolian                         |	mn	 
Nepali                            |	ne	 
Northern Sami                     |	se
Norwegian Bokmål                  |	nb
Norwegian Nynorsk                 |	nn
Oriya                             |	or	 
Oromo                             |	om
Pashto                            |	ps	 
Persian                           |	fa	 
Persian (Afghanistan)             |	fa_AF	 
Polish                            | pl	 
Portuguese                        |	pt	 
Punjabi                           |	pa	 
Romanian                          |	ro	 
Russian                           |	ru	 
Serbian                           |	sr	 
Serbian (Latin)                   |	sr_Latn
Sinhala                           |	si
Slovak                            |	sk
Slovenian                         |	sl	 
Spanish                           |	es
Swahili                           |	sw
Swedish                           |	sv
Tamil                             |	ta
Telugu                            |	te	 
Thai                              |	th	 
Tibetan                           |	bo	 
Tongan                            |	to	 
Turkish                           |	tr
Ukrainian                         |	uk	 
Upper Sorbian                     |	hsb	 
Urdu                              |	ur	 
Uyghur                            |	ug	 
Vietnamese                        |	vi
Walser                            |	wae	 
Welsh                             |	cy	 
Yiddish                           |	yi
Yoruba                            |	yo	 
Zulu                              |	zu

O primeiro argumento do construtor da classe `Connector` é a URL do local onde o banco de dados mongodb está localizado. O segundo argumento é a instância da classe `Restful`, que representa a instância do framework _Alpha Restful_. O terceiro argumento é a instância do Express JS.

O primeiro argumento da função `www` é o connector do banco de dados MongoDB. Se o segundo argumento for `true`, o Alpha Restful irá gerar automaticamente rotas para tratamento de erros. O `www` é uma função que retorna uma promise, na qual o retorno da promise é um objeto contendo o atributo `server` (representando a chamada do método `require('http').createServer(app)`) e o atributo `debug` (usado para mostrar mensagens de debug).

Toda a implementação de sua aplicação deverá ocorrer antes da chamada do método `www`. Aqui serão mostrados códigos como se estivessem dentro de um mesmo arquivo, mas o programador poderá se sentir a vontade de modularizar seu código em vários arquivos seguindo a estrutura que achar melhor.

Para executar a sua aplicação, basta executar o comando:

```sh
node <arquivo-principal>.js
```

Para executar a sua aplicação no _linux_ / _Mac OS_ no modo _debug_ execute:

```sh
DEBUG=<nome-da-aplicação>:* node <arquivo-principal>.js
```

Para executar a sua aplicação no _windows_ no modo _debug_ execute:

```sh
set DEBUG=<nome-da-aplicação>:* & node <arquivo-principal>.js
```

### Modelando suas Entidades

Digamos que você deseje criar a entidade _Pessoa_ com o atributo _nome_ e _idade_, disponível na URI _/pessoas_. Para fazer isto bastaria fazer o seguinte código:

```js
const Pessoa = new Entity({
    name: 'Pessoa', // Nome da sua entidade
    resource: '/pessoas', // URI utilizada para acessar os recursos REST desta entidade. Também é o nome da coleção de documentos utilizada para esta entidade (sem a barra)
    descriptor: { // Objeto que descreve os atributos da entidade
        name: String, // Uma pessoa possui um nome que é do tipo String
        idade: Number // Uma pessoa possui uma idade que é do tipo Number
    }
})

restful.add(Pessoa) // Adiciona ao Restful a entidade Pessoa
```

O _descriptor_ descreve como a entidade _Pessoa_ está modelada. A sintaxe do descriptor segue as especificações presentes nos [_schemas_](https://mongoosejs.com/docs/guide.html) do Mongoose.

### Integração com o Mongoose

O Alpha Restful é completamente integrado com o Mongoose. Todas as funcionalidade disponibilizadas pelo Mongoose poderão ser utilizadas dentro de seu projeto Alpha Restful.

Para acessar o [schema](https://mongoosejs.com/docs/guide.html) da entidade para uso do Mongoose, basta digitar `Pessoa.schema`. Para acessar o [model](https://mongoosejs.com/docs/models.html) da entidade para uso do Mongoose, basta digitar `Pessoa.model`.

### Criando CRUD de Entidade

Para que o Alpha Restful crie as rotas dos métodos http de CRUD, basta informar na entidade quais métodos http devem ser gerados automaticamente:

```js
const Pessoa = new Entity({
    name: 'Pessoa', // Nome da sua entidade
    resource: '/pessoas', // URI utilizada para acessar os recursos REST desta entidade. Também é o nome da coleção de documentos utilizada para esta entidade (sem a barra)
    descriptor: { // Objeto que descreve os atributos da entidade
        name: String, // Uma pessoa possui um nome que é do tipo String
        idade: Number // Uma pessoa possui uma idade que é do tipo Number
    },
    methods: ['get', 'post', 'put', 'delete', 'patch'] // Métodos http dos CRUDS
})
```

Para que o Alpha Restful gere automaticamente todas as rotas de CRUD definidas em todas as entidade, é necessário executar o seguinte código **após** a definição das entidades:

```js
restful.applyRouters(app)
```

### Relacionamento entre Entidades

O Mongoose possui uma funcionalidade chamada de [populate](https://mongoosejs.com/docs/populate.html). Esta funcionalidade permite um certo relacionamento entre entidades.

Porém o Alpha Restful disponibiliza seu próprio método de relacionamento entre entidades, disponibilizando diversas funções a mais.

Para que as funcionalidades a seguir descritas funcionem, é necessário que o relacionamento entre entidades seja realizado por meio do Alpha Restful.

#### Relacionamento no Dono da Relação (Onde Serão Armazenados os ids)

Digamos que você crie uma entidade chamada de _Casa_, e deseje fazer um relacionamento de muitos para muitos entre _Casa_ e _Pessoa_. Neste caso, bastaria implementar o modelo da entidade _Casa_ e definir o relacionamento em algum atributo da entidade:

```js
const Casa = new Entity({
    name: 'Casa',
    resource: 'casas',
    descriptor: {
        endereco: {
            numero: String,
            rua: String,
            cidade: String,
            estado: String,
            pais: String
        },
        /*
        Uma casa possui várias pessoas. No documento da
        entidade Casa, armazena-se uma lista de objetos,
        na qual pelo menos o id da entidade Pessoa deve
        ser armazenada
        */
        pessoas: [{
            id: mongoose.Schema.Types.ObjectId // Id da entidade pessoa
        }]
    },
    /*
    A opção sync é responsável por descrever o comportamento
    de cada atributo da entidade. Nesta opção, torna-se
    possível sincronizar um atributo da entidade com
    instâncias de outras entidades
    */
    sync: {
        pessoas: 'Pessoa'
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Na entidade _Casa_, definiu-se o atributo _pessoas_. Neste atributo será armazenado uma lista de objetos contendo atributos de cada pessoa relacionada. O _id_ deve ser obrigatoriamente armazenado, mas outros atributos da entidade podem ser armazenados, assim como atributos presentes no relacionamento entre _Casa_ e _Pessoa_. Caso a entidade _Casa_ possua apenas uma pessoa, bastaria remover os colchetes ( [ ] ) que envolvem a definição do objeto armazenado pelo atributo.

Através da opção _sync_, sincronizou-se o atributo _pessoas_ com a entidade _Pessoa_. Através do _sync_, diversas opções estão disponíveis para o atributo sincronizado. Neste exemplo, apenas um relacionamento simples está definido. Para relacionamentos simples (relacionamentos sem outras opções), basta colocar no lado direito uma String contendo o nome da entidade relacionada.

#### Relacionamento na Entidade Relacionada

Mas, e se desejarmos obter na entidade _Pessoa_ a lista de casas relacionadas a ela? Nós não podemos repetir o procedimento anterior na entidade _Pessoa_, pois o Alpha Restful interpretaria isso como outro relacionamento. Nós poderíamos criar um novo atributo em _Pessoa_ para armazenar manualmente todos os ids das casas que se relacionam com a pessoa armazenada, porém isto deixaria o código da sua aplicação complexa e suscetível a erros humanos.

Pensando nisto, o Alpha Restful dispõe de uma opção na qual você informa que existe um atributo virtual, representando o relacionamento feito por outra entidade. Este atributo não é armazenado em seu banco de dados, porém o Alpha Restful irá considerar este atributo como se ele estivesse declarado na entidade. Tal atributo virtual representa o relacionamento na entidade relacionada, sem que seja necessário adicionar nenhum dado no documento do MongoDB.

Para realizar este procedimento, a fim de obter em pessoa as casas a ela relacionada, bastaria adicionar no _sync_ um atributo com a opção _syncronized_:

```js
const Pessoa = new Entity({
    name: 'Pessoa',
    resource: '/pessoas',
    descriptor: {
        name: String,
        idade: Number
    },
    sync: {
        /*
        Como este relacionamento exige a passagem de
        novas opções, ao invés da String contendo o
        nome da entidade, coloca-se um objeto, na
        qual o atributo name é o nome da entidade
        relacionada.
        */
        casas: {
            name: 'Casa',

            /*
            A opção syncronized descreve
            o nome do atributo que realiza o
            relacionamento com esta entidade.
            */
            syncronized: ['pessoas']
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

No _sync_ da entidade _Pessoa_, defini-se que uma pessoa possui um relacionamento com _Casa_, porém o atributo _casas_ não será armazenado no banco (por isso este atributo não está presente no _descriptor_), porém o Alpha Restful irá considerar a existência de tal atributo em pesquisas no banco de dados. A opção _syncronized_ no _sync_ de _Pessoa_ contém o nome do atributo na entidade _Casa_ que se relaciona com _Pessoa_. Se houverem várias casas, envolve-se em colchetes ( [ ] ) o nome do atributo. Caso haja sempre apenas uma _Casa_, remove-se os colchetes no nome do atributo em _syncronized_.

Por padrão o Alpha Restful irá buscar todos os ids das casas relacionadas com esta pessoa e colocar no atributo _casas_ automaticamente em tempo de execução. Para que este atributo não seja buscado ao realizar uma busca por pessoa, basta adicionar uma opção de _jsonIgnore_ que será explicado mais a frente. Mesmo que seja adicionada esta opção, você ainda poderá buscar pessoas filtradas por este atributo.

#### Garantia Automática de Consistência dos Dados

Neste exemplo na qual estamos abordando, caso uma pessoa seja removida, automaticamente serão removidos os atributos da pessoa nas instâncias de entidades que se relacionam com _Pessoa_. Desta forma não haverá ids de entidades que já não existem mais no banco de dados. Se por algum motivo você desejar que este comportamento seja desativado em algum atributo, basta adicionar a opção _ignoreVerifyRelationship_ com o valor `true` no _sync_ do atributo da entidade desejada.

### Atributos de Relacionamento

O Alpha Restful permite que sejam definidos atributos de relacionamentos. Estes atributos de relacionamento podem ser atributos presentes dentro da entidade relacionada, como também podem ser atributos presentes apenas dentro do relacionamento.

Como exemplo, imagine a seguinte situação: imagine que no relacionamento entre _Pessoa_ e _Casa_ existe um aluguel. Vamos imaginar que por algum motivo o aluguel precisa ser modelado como uma entidade separada. Neste caso, pode-se representar esta situação com o seguinte código:

```js
const Aluguel = new Entity({
    name: 'Aluguel',
    resource: 'alugueis',
    descriptor: {
        valor: Number,
        dataInicio: Date,
        dataFim: Date
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})

restful.add(Aluguel)

const Casa = new Entity({
    name: 'Casa',
    resource: 'casas',
    descriptor: {
        endereco: {
            numero: String,
            rua: String,
            cidade: String,
            estado: String,
            pais: String
        },
        pessoas: [{
            id: mongoose.Schema.Types.ObjectId,

            /*
            No relacionamento entre Pessoa e Casa existe
            um atributo de relacionamento chamado aluguel
            que por sua vez se relaciona com a entidade
            Aluguel
            */
            aluguel: {
                id: mongoose.Schema.Types.ObjectId
            }
        }]
    },
    sync: {
        pessoas: {
            name: 'Pessoa',

            /*
            Dentro de cada pessoa existe um atributo de
            relacionamento chamado aluguel que se
            relaciona com a entidade Aluguel
            */
            sync: {
                aluguel: 'Aluguel'
            }
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Atributos de relacionamento são atributos normais, na qual podem se relacionar com outras entidades e podem receber opções como qualquer outra opção.

### Json Ignore

Caso você deseje que determinado atributo não seja adicionado por padrão no json de busca da entidade, basta colocar a opção _jsonIgnore_ no _sync_ do atributo na qual deseja-se que seja omitido.

```js
const Pessoa = new Entity({
    name: 'Pessoa',
    resource: '/pessoas',
    descriptor: {
        name: String,
        idade: Number
    },
    sync: {
        idade: {

            /*
            Ao buscar uma pessoa, o atributo idade não
            existirá
            */
            jsonIgnore: true
        }
        casas: {
            name: 'Casa',
            syncronized: ['pessoas'],

            /*
            Ao buscar uma pessoa, o atributo casas não
            existirá
            */
            jsonIgnore: true
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Neste exemplo, os atributos _idade_ e _casas_ não serão incluídos no json de busca da entidade _Pessoa_.

#### Atenção!!

Por questões de desempenho, somente atributos diretos são garantidos de maneira incondicional a serem ignorados pelo _jsonIgnore_, ou seja, na entidade _Casa_, os atributos dentro de _endereco_ não serão ignorados de maneira individual. Os atributos dentro de _endereco_ serão ignorados se o atributo _endereco_ for ignorado. Caso você deseje que um sub-atributo possa ser ignorado de maneira garantida e individual, basta adicionar a opção _ignoreFieldsRecursive_ como `false` nas opções da entidade.

O _jsonIgnore_ é aplicado na função de preenchimento de entidades explicada posteriormente.

### Rotas Personalizadas com Funções Assincronas

Se você deseja criar uma rota personalizada usando funções assincronas, você pode utilizar o método `restful.execAsync`.

Como exemplo, vamos criar a estrutura de uma rota http _get_ com a URI _/rota-personalizada_:

```js
app.get('/rota-personalizada',
    restful.execAsync(async function (req, res, next) {
        // ...
        // Executando alguma coisa
        // ...
    })
)
```

Para mais informações sobre a criação de rotas personalizadas com o Express JS acesse <https://expressjs.com/en/starter/basic-routing.html>.

#### Atenção

Independente da função da rota ser assincrona ou sincrona, para passar a execução para a rota seguinte é necessário chamar o método `next()`. Se a rota retornar o resultado para o cliente, o método `next()` não deverá ser chamado. Caso ocorra algum erro, pode-se colocar o objeto do erro na chamada da função `next` da seguinte forma: `next(<objeto do erro>)`. Mais informações podem ser obtidas na [documentação de roteamento do Express JS](https://expressjs.com/en/starter/basic-routing.html).

### Preenchimento Automático de Entidade Relacionada

Se você desejar que por padrão uma entidade relacionada tenha seus atributos buscados e colocados no atributo do relacionamento, basta adicionar a opção _fill_ no _sync_ do atributo da entidade desejada:

```js
const Casa = new Entity({
    name: 'Casa',
    resource: 'casas',
    descriptor: {
        endereco: {
            numero: String,
            rua: String,
            cidade: String,
            estado: String,
            pais: String
        },
        pessoas: [{
            id: mongoose.Schema.Types.ObjectId,
            aluguel: { id: mongoose.Schema.Types.ObjectId }
        }]
    },
    sync: {
        pessoas: {
            name: 'Pessoa',

            /*
            Caso fill seja true, o atributo pessoas
            receberá os valores contidos na entidade
            relacionada
            */
            fill: true,

            sync: { aluguel: 'Aluguel' }
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Neste caso, ao buscar uma _Casa_, serão jogados no atributo _pessoas_ todos os atributos existentes dentro de pessoa. Este procedimento é recursivo, ou seja, se _Pessoa_ possuir atributos com _fill_ igual a `true`, estes atributos de pessoa também serão preenchidos.

#### Preenchimento Automático em Sub-Atributos

Por questões de performance, um sub-atributo somente pode ser preenchido se o atributo pai tiver a opção _fill_ ou _subFill_ igual a `true`. Desta forma, se quisermos preencher (em nosso exemplo) somente o atributo _aluguel_, precisaríamos implementar algo como:

```js
const Casa = new Entity({
    // ...
    sync: {
        pessoas: {
            name: 'Pessoa',

            /*
            Indica que um sub-atributo poderá ser
            preenchido
            */
            subFill: true,

            sync: {
                aluguel: {
                    name: 'Aluguel',

                    /*
                    Preenche o atributo aluguel com os
                    valores presentes na entidade Aluguel
                    */
                    fill: true
                }
            }
        }
    },
    // ...
})
```

Se além do aluguel quisermos preencher o atributo _pessoas_, bastaria adicionar a opção _fill_ igual a `true`, ou substituir a opção _subFill_ pelo atributo _fill_ no _sync_ de pessoas:

```js
const Casa = new Entity({
    // ...
    sync: {
        pessoas: {
            name: 'Pessoa',

            /*
            Também indica que um sub-atributo poderá ser
            preenchido, porém também preenche o atributo
            pessoas
            */
            fill: true,

            sync: {
                aluguel: {
                    name: 'Aluguel',

                    /*
                    Preenche o atributo aluguel com os
                    valores presentes na entidade Aluguel
                    */
                    fill: true
                }
            }
        }
    },
    // ...
})
```

Se a opção _fill_ é igual a `true`, o atributo sincronizado irá ser preenchido, mas se além desta opção também está presente a opção _subFill_ igual a `false`, então o Alpha Restful não irá preencher os sub-atributos dos níveis abaixo.

Uma alternativa ao _fill_ é a opção _fillRec_. Tal opção contém um número que indica quantos níveis abaixo serão preenchidos com a opção _fill_ igual a `true`. Se _fillRec_ for um número negativo, o Alpha Restful irá tentar expandir todos os níveis abaixo em todos os sub-atributos da entidade e das sub-entidades. A opção _fill_ possui maior prioridade que a opção _fillRec_. Se _fillRec_ for negativo, a recursão somente terminará se algum _fill_ abaixo for igual a `false` ou se não houver mais atributos abaixo para ser preenchidos.

##### Observação

Da mesma forma, por padrão, sub-atributos somente poderão ser ignorados pelo _jsonIgnore_ se o atributo pai tiver a opção _fill_ ou _subFill_. Caso você deseje que sub-atributos possam ser ignorados pelo _jsonIgnore_, independente das opções _fill_ e _subFill_, basta adicionar a opção _ignoreFieldsRecursive_ como `false` nas opções da entidade.

Se você desejar que por padrão sub-atributos de sub-entidades também possam ser ignorados pelo _jsonIgnore_ de maneira individual, independente das opções _fill_ e _subFill_, além de adicionar a opção _ignoreFieldsRecursive_ como `false`, torna-se necessário também adicionar a opção _ignoreFieldsRecursiveSubEntity_ como `false` nas opções da entidade.

#### Evitando Preenchimento Circular

Digamos que desejemos preencher o atributo _casas_ na entidade _Pessoa_. Para fazer isto poderíamos escrever:

```js
const Pessoa = new Entity({
    name: 'Pessoa',
    resource: '/pessoas',
    descriptor: {
        name: String,
        idade: Number
    },
    sync: {
        casas: {
            name: 'Casa',
            syncronized: ['pessoas'], // Atributo usado pela Casa para se relacionar com Pessoa
            fill: true // Preenche o atributo casas com os valores da casa relacionada
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Digamos também que desejemos preencher o atributo _pessoas_ na entidade _Casa_. Neste caso poderíamos também fazer o seguinte:

```js
const Casa = new Entity({
    // ...
    sync: {
        pessoas: {
            name: 'Pessoa',
            fill: true, // Preenche o atributo pessoas com os valores da pessoa relacionada

            sync: {
                aluguel: { name: 'Aluguel' }
            }
        }
    },
    // ...
})
```

Se executarmos uma pesquisa por _Pessoa_ ou por _Casa_, nós iremos notar um problema: o sistema irá entrar em recursão infinita, pois ao buscar uma _Pessoa_, o atributo _casas_ será preenchido pelos atributos de _Casa_. Por sua vez, nos atributos de _Casa_ são preenchidos os atributos de _Pessoa_, assim o procedimento segue, gerando um erro de preenchimento circular.

Para evitar que este erro ocorra, existem duas opções que podem ser utilizadas: _jsonIgnoreProperties_ e _ignoreFillProperties_.

O _jsonIgnoreProperties_ contém uma lista de nomes (ou apenas uma String com o nome desejado) de atributos que não serão incluídos dentro do json depois da recursão na qual esta opção está inserida.

O _ignoreFillProperties_ contém uma lista de nomes (ou apenas uma String com o nome desejado ) de atributos que não serão preenchidos depois da recursão na qual esta opção está inserida.

```js
const Pessoa = new Entity({
    // ...
    sync: {
        casas: {
            name: 'Casa',
            syncronized: ['pessoas'],
            fill: true,

            /*
            Todos os atributos abaixo desta recursão com
            o nome 'pessoas' não serão preenchidos
            */
            ignoreFillProperties: ['pessoas']
        }
    },
    // ...
})

const Casa = new Entity({
    // ...
    sync: {
        pessoas: {
            name: 'Pessoa',
            fill: true,

            /*
            Todos os atributos abaixo desta recursão com
            o nome 'casas' não serão incluídos dentro do
            json
            */
            ignoreJsonProperties: ['casas'],

            sync: {
                aluguel: { name: 'Aluguel' }
            }
        }
    },
    // ...
})
```

No código exemplo apresentado, ao buscar uma _Pessoa_, o atributo _pessoas_ na entidade _Casa_ não será preenchido. Ao buscar uma _Casa_, o atributo _casas_ na entidade _Pessoa_ não será incluído no json.

### Opção de Dependência em Relacionamento

Digamos que uma pessoa não possa ser removida se houver um relacionamento desta pessoa com uma _Casa_. Neste caso basta informar que o relacionamento de _Pessoa_ com _Casa_ é um relacionamento de dependência. Para isto basta informar a opção _required_ com valor `true`:

```js
const Casa = new Entity({
    // ...
    sync: {
        pessoas: {
            name: 'Pessoa',
            fill: true,
            ignoreJsonProperties: ['casas'],

            /*
            As pessoas armazenadas no atributo 'pessoas'
            não poderão ser removidas enquando estiverem
            dentro deste relacionamento
            */
            required: true,

            sync: {
                aluguel: { name: 'Aluguel' }
            }
        }
    },
    // ...
})
```

### Opção de Remoção em Cascata

Digamos que ao remover uma _Casa_, todas as pessoas relacionadas com esta _Casa_ devam ser removida também de maneira automática. Neste caso basta colocar a opção _deleteCascade_ igual a `true`.

```js
const Pessoa = new Entity({
    // ...
    sync: {
        casas: {
            name: 'Casa',
            syncronized: ['pessoas'],
            fill: true,
            ignoreFillProperties: ['pessoas'],

            /*
            Se uma casa relacionada for removida, a
            pessoa relacionada será removida também
            */
            deleteCascade: true
        }
    },
    // ...
})
```

### Rota Padrão de Busca

Caso seja habilitada a criação de CRUD, habilitando a geração de método http _get_, automaticamente é gerada uma rota de busca na qual buscas complexas podem ser realizadas alterando apenas os parâmetros da rota.

Como exemplo de busca, imagine que deseja-se buscar todas as casas, na qual existe pelo menos uma pessoa que mora em alguma _Casa_, que nesta _Casa_ existe uma pessoa que possui idade maior ou igual a 18 anos. Para se realizar esta pesquisa bastaria fazer uma requisição http _get_ com a seguinte url:

```http
/casas?pessoas.casas.pessoas.idade__$gte=18
```

Nesta rota de busca pode-se realizar pesquisas em atributos e sub-atributos da entidade e de sub-entidades relacionadas.

Você também pode adicionar várias condições. Neste caso, você poderia deixar esta busca ainda mais específica, exigindo que todas as casas buscadas precisa-se estar na rua "Castelo". Neste caso bastaria realizar a seguinte requisição http _get_:

```http
/casas?pessoas.casas.pessoas.idade__$gte=18&endereco.rua=Castelo
```

Segue uma tabela com todas as opções de busca nesta rota de pesquisa gerada automaticamente:

Filtro              | Condição    | Exemplo                       | Descrição
------------------- | ----------- | ----------------------------- | --------------------------
Igual               | __$eq       | `/pessoas?nome=Emanuel` ou `/pessoas?nome__$eq=Emanuel` | Busca todas as pessoas com o nome igual a _Emanuel_
Diferente           | __$ne       | `/pessoas?nome__$ne=Emanuel`  | Busca todas as pessoas na qual o nome é diferente de _Emanuel_
Maior que           | __$gt       | `/pessoas?idade__$gt=18`      | Busca todas as pessoas com idade maior que 18
Maior ou Igual      | __$gte       | `/pessoas?idade__$gte=18`      | Busca todas as pessoas com idade maior ou igual a 18
Menor que           | __$lt       | `/pessoas?idade__$lt=18`      | Busca todas as pessoas com idade menor que 18
Menor ou Igual      | __$lte       | `/pessoas?idade__$lte=18`      | Busca todas as pessoas com idade menor ou igual a 18
Está Em             | __$in       | `/pessoas?idade__$in=18,19`   | Busca todas as pessoas com idade igual a 18 ou 19 anos
Não Está Em         | __$nin      | `/pessoas?idade__$nin=18,19`  | Busca todas as pessoas na qual a idade não é 18 nem 19 anos
Expressão Regular   | __regex     | `/pessoas?nome__regex=/^Em/i` | Busca todas as pessoas na qual o nome começa com "Em" (Case Insensitive)
Negação da Expressão Regular   | __$not_regex     | `/pessoas?nome__$not_regex=/^Em/i` | Busca todas as pessoas na qual o nome não começa com "Em" (Case Insensitive)
Limite              | limit       | `/pessoas?limit=10`           | Busca as pessoas com um limite de 10 pessoas
Pular               | skip        | `/pessoas?skip=20`            | Busca todas as pessoas pulando as 20 primeiras pessoas da pesquisa
Ordenar Crescente   | order       | `/pessoas?order=name`         | Busca todas as pessoas ordenando de maneira crescente por nome
Ordenar Decrescente | order       | `/pessoas?order=-name`        | Busca todas as pessoas ordenando de maneira decrescente por nome
Quantidade          | selectCount | `/pessoas?selectCount=true`   | Busca a quantidade de pessoas registradas no banco de dados
Selecionar          | select      | `/pessoas?select=name,idade`  | Busca todas as pessoas selecionando o nome e a idade

### Método de Busca

Digamos que você deseje realizar uma busca em uma rota personalizada, utilizando um poder ainda maior do que as opções disponíveis anteriormente. Neste caso, basta você chamar o método `restful.query(<condições>, <Entidade>, <opções>)`.

Por exemplo: digamos que você deseje realizar uma pesquisa de todas as casas, na qual existe pelo menos uma pessoa que mora em alguma _Casa_, que nesta _Casa_ existe uma pessoa que possui idade maior ou igual a 18 anos. Para realizar esta pesquisa basta realizar a seguinte chamada de método:

```js
let casas = await restful.query({
    'pessoas.casas.pessoas.idade': {
        $gte: 18
    }
}, Casa)
```

O primeiro argumento do método de busca contém as especificações do [objeto de busca](https://mongoosejs.com/docs/queries.html) usado pelo Mongoose, com o diferencial de poder utilizar atributos de sub-entidades de sub-entidades, como se elas estivessem dentro do mesmo documento.

O terceiro argumento é opcional e é um objeto com várias opções para a pesquisa. As opções deste Objeto são:

Opção             | Valor Padrão | Descrição
----------------- | :----------: | -----------
select            | `null`       | Atributos a serem buscados
skip              | `null`       | Quantidade de elementos a serem pulados
limit             | `null`       | Quantidade máxima de elementos  da busca
sort              | `null`       | Atributo a ser ordenado
internalSearch    | `true`       | Se for `false` retorna um objeto de busca que pode ser utilizado como primeiro argumento do método de busca do Mongoose (`Entidade.model.find`). Se for `true` retorna-se o resultado da busca
selectCount       | `false`      | Se for `true` retorna a quantidade de elementos da busca. Se for `false` retorna os elementos da busca.
isCopyEntity      | `false`      | Se for `false` **não** realiza a cópia das entidades buscadas. Neste caso, os atributos das entidades retornadas são imutáveis. Se for `true` as entidades retornadas são uma cópia das originais. Neste caso pode-se alterar os valores de seus atributos. As cópias das entidades **não** possuem os métodos utilizados pelo _mongoose_.
findOne           | `false`      | Se for `true`, apenas uma entidade é buscada e retornada.
descriptor        | `null`       | Objeto que descreve a modelagem da entidade. Caso seja `null`, o _descriptor_ utilizado é o _descriptor_ definido na modelagem da entidade.

#### Atenção!

O método `restful.query` utiliza as definições presentes do _descriptor_ das entidades para mapear as possibilizades de busca, inclusive com os atributos presentes nas sub-entidades. Por causa deste comportamento, todos os atributos devem ser mapeados no _descriptor_ para serem localizados pelo `restful.query`, porém existem situações na qual um atributo é do tipo `Object` ou `Array` e seus sub-atributos são dinâmicos e impossíveis de serem mapeados. Neste caso, no objeto _sync_ deste atributo deve ser habilitado a opção `dynamicData` igual a `true`. Com esta opção habilitada, o método `restful.query` **não** irá procurar sub-atributos na entidade relacionada pelo atributo dinâmico.

#### Observação

O método `restful.query` irá internamente chamar o método de busca do Mongoose (`Entidade.model.find`), portanto a sintaxe presente no objeto de busca do Mongoose é preservada pelo método `restful.query`, com a diferença de que através do método `restful.query`, os atributos das entidades relacionadas são enxergadas pelo método de busca, como se eles já estivessem dentro do documento principal.

Para mais informações sobre o método de busca do mongose [Acesse](https://mongoosejs.com/docs/queries.html).

#### Atenção!

Ao realizar uma pesquisa no método `restful.query`, os atributos com a opção _jsonIgnore_ igual a `true` **não** serão ignorados. Para que estes atributos sejam ignorados é necessário que o método de preenchimento (explicado logo a seguir) seja chamado.

### Método de Preenchimento

Caso você deseja preencher os atributos com relacionamentos, basta chamar o método `Entidade.fill(<dados>, restful, <opções>)`.

Por exemplo, vamos imaginar que você deseje que uma _Pessoa_ tenha o atributo _nome_ ignorado no json e que o atributo _casas_ seja preenchido **independente** do valor contido no _sync_ da modelagem, mas que isto tenha efeito em apenas uma rota especifica. Para isto bastaria fazer a seguinte chamada de código:

```js
pessoas = await Pessoa.fill(pessoas, restful, {
    sync: {
        nome: { jsonIgnore: true },
        casas: { fill: true }
    }
})
```

O primeiro argumento do método `fill` é uma pessoa ou uma lista de pessoas que terão seus atributos expandidos. O segundo argumento é a instância do Alpha Restful. O último argumento é um objeto opcional contendo opções para o preenchimento.

Neste exemplo, apenas para esta chamada, você está sobrescrevendo o comportamento padrão do _sync_. Dentre as opções do ultimo argumento, você pode passar a opção _syncs_, opção esta que é um objeto na qual a chave do objeto é o nome da entidade e o valor é o _sync_ da entidade que substituirá o _sync_ padrão definido na modelagem. Como exemplo disto nós temos:

```js
pessoas = await Pessoa.fill(pessoas, restful, {
    sync: {
        nome: { jsonIgnore: true },
        casas: { fill: true }
    },
    syncs: {
        Casa: {
            pessoas: { jsonIgnore: true }
        }
    }
})
```

Neste exemplo, **independente** do que foi definido na modelagem, apenas para esta chamada, as pessoas terão seu _nome_ removidos do json, o atributo _casas_ será preenchido, mas o atributo _pessoas_ dentro da entidade _Casa_ não será incluído dentro do atributo _casas_ em _Pessoa_.

As opção passadas no objeto do último argumento são:

Opção                | Valor Padrão | Descrição
-------------------- | :----------: | ----------
sync                 | `null`       | Objeto _sync_ a ser usado ao invés do _sync_ definido na modelagem. Se for `null` usa-se o sync da modelagem
syncs                | `{}`         | Objeto cuja a chave é o nome da entidade e o valor é o _sync_ a ser usado ao invés do _sync_ definido na modelagem de tal entidade. A entidade que não estiver dentro desta opção terá o _sync_ definido em sua modelagem usado.
ignoreFillProperties | `[]`         | Lista de propriedade que não serão preenchidas em qualquer nível.
jsonIgnoreProperties | `[]`         | Lista de propriedade que não serão incluídas em qualquer nível.

#### Atenção!

A opção _sync_ do último argumento do método `Entidade.fill` **apenas** é aplicada ao primeiro nível, ou seja, no exemplo apresentado, se houver alguma sub-entidade que se relaciona com _Pessoa_, o _sync_ de Pessoa utilizado será o objeto _sync_ definido na modelagem da entidade.

Por causa disso, no exemplo apresentado, o atributo _pessoas_ em _Casa_, se não estivesse sendo ignorado, utilizaria o objeto _sync_ definido na modelagem da entidade. Para sobrescrever o _sync_ em todas as chamadas e sub-chamadas de todas as sub-entidades de sub-entidades, seria necessário sobrescrever também na opção _syncs_:

```js
pessoas = await Pessoa.fill(pessoas, restful, {
    sync: {
        nome: { jsonIgnore: true },
        casas: { fill: true }
    },
    syncs: {
        Casa: {
            pessoas: { jsonIgnore: true }
        },
        Pessoa: {
            nome: { jsonIgnore: true },
            casas: { fill: true }
        }
    }
})
```

#### Observação

Por padrão, ao preencher um atributo com a entidade relacionada, todos os valores deste atributo serão preenchidos e estarão dentro do json, mas pode-se ordenar e paginar os resultandos dentro do preenchimento, utilizando as opções _limit_ (quantidade máxima de elementos), _skip_ (quantidade de elementos a serem pulados) e _sort_ (atributo a ser ordenado de maneira crescente ou decrescente (com o hífen no início)).

A opção _sort_ irá ordenar os elementos de dentro do atributo pelo atributo passado nesta opção. Por padrão, apenas atributos armazenados dentro do documento principal poderão ser utilizados pela ordenação. Caso seja necessário ordenar por algum atributo presente na entidade relacionada, é necessário habilitar como `true` a opção _ignoreSubAttr_, que irá excluir do json os atributos de relacionamento presentes dentro do documento principal.

Caso a opção _ignoreSubAttr_ seja `true`, pode-se utilizar a opção `find` dentro das opções de preenchimento. A opção _find_ permite que seja definido uma especificação de pesquisa, para que apenas as subentidades que se encaixar nestas condições sejam incluídas dentro do json. O valor de _find_ pode ser um objeto literal de busca (objeto a ser utilizado no primeiro argumento do método `restful.query`), assim como pode ser também uma função que retorna este objeto literal. Para este último caso, o primeiro argumento da função é a instância da entidade que terá seus atributos preenchidos e o segundo argumento da função é um array com todos os valores presentes no documento principal dentro do atributo a ser preenchido.

Também é possível selecionar quais atributos diretos (primeiro nível) estarão contidos dentro do json com a opção _select_, que pode ser um array com todos os atributos a serem adicionados no json, mas pode ser também uma string, separando os atributos a serem selecionados com espaço.

#### Forma Alternativa Para Integrar Preenchimento em Rotas Personalizadas

O método de preenchimento `Entidade.fill` pode ser chamado dentro de uma rota personalizada para preencher os atributos com os valores contidos nas entidades relacionadas por eles. Esse método pode ser chamado explicitamente, mas também pode ser chamado de maneira alternativa como uma opção ao método `restful.execAsync`:

```js
app.get('/rota-personalizada',
    restful.execAsync(async function (req, res, next) {
        // ...
        // Código da rota personalizada
        // ...

        res._content_ = casas
        next()

    }, Casa.afterGetFill(restful), 200)
)
```

#### Sync Dinâmico

Especificamente para a função de preenchimento, pode ser definido um objeto _sync_ dinâmico! Para fazer isto, basta ao invés de passar um objeto, passar uma função, que recebe a entidade na qual se deseja preencher como argumento e retorna o _sync_ a ser utilizado. Isto se torna muito poderoso para os relacionamentos virtuais que serão vistos posteriormente!

Como exemplo disto, imaginemos que somente as pessoas que não tiverem seu _nome_ iniciados com "Emanuel" devem ter seus nomes ignorados no json de resposta. Para fazer isto basta digitar o seguinte código:

```js
pessoas = await Pessoa.fill(pessoas, restful, {
    sync: pessoa => ({
        nome: { jsonIgnore: !pessoa.nome.startsWith('Emanuel') },
        casas: { fill: true }
    }),
    syncs: {
        Casa: {
            pessoas: { jsonIgnore: true }
        }
    }
})
```

### Opções de Remoção de Entidades

Caso você deseje excluir uma entidade manualmente via linha de código e ainda manter o comportamento definido nos objetos _sync_ para as opções _required_, _deleteCascade_ e garantir que não existirá ids em relacionamentos apontando para entidades que já não existem mais, basta chamar o método `restful.deleteSync(<id>, <nome da entidade>, <syncronized>)`.

Como exemplo, o código que garantirá este comportamento na remoção de uma pessoa seria:

```js
await restful.deleteSync(pessoa._id, 'Pessoa', Pessoa.syncronized)
```

O primeiro argumento é o id da pessoa a ser removida. O segundo argumento é uma String contendo o nome da entidade e o terceiro argumento é um objeto gerado automaticamente pelo Alpha Restful, contendo todos os relacionamentos que outras entidades possuem com _Pessoa_.

Este método **NÃO** irá remover a pessoa. Este método irá manter o comportamento padrão que o Alpha Restful aplica em uma entidade **antes** dela ser removida.

Após a chamada deste método, pode-se remover a entidade usando as ferramentas do Mongoose ou usando as ferramentas disponibilizadas pelo MongoDB.

Como exemplo de um método disponibilizado para remoção de entidades no Mongoose temos:

```js
await pessoa.remove()
```

### Manipulação da Entidade Pelo Moongose e pelo MongoDB

Caso você dejese salvar, buscar, editar ou remover uma entidade, pode-se utilizar os métodos disponíveis pelo Mongoose ou pelo MongoDB. O _schema_ da entidade descrita pela documentação do Mongoose pode ser obtido através da opção `Entidade.schema`. O _model_ da entidade descrita pela documentação do Moongose pode ser obtido através da opção `Entidade.model`. Caso você busque uma entidade pelo método `restful.query` e deseje ter acesso aos métodos do objeto disponibilizados pelo Mongoose, basta desabilitar a opçao `isCopyEntity`, assim como é explicado na seção **Método de Busca** deste documento.

Para mais informações sobre os métodos disponibilizados pelo Mongoose para manipulação de entidades acesse a documentação pelo link <https://mongoosejs.com/docs/guides.html>.

### Relacionamento Virtual

Um relacionamento virtual é um relacionamento que existe entre uma entidade com outra entidade por intermédio de uma definição de pesquisa estática.

Digamos que toda vez que buscarmos uma pessoa, gostaríamos de obter dentro da pessoa um atributo contendo a quantidade de casas registradas no sistema. Para isto, podemos fazer um relacionamento virtual.

```js
const Pessoa = new Entity({
    name: 'Pessoa',
    resource: '/pessoas',
    descriptor: {
        name: String,
        idade: Number
    },
    sync: {
        casas: {
            name: 'Casa',
            syncronized: ['pessoas'],
            fill: true,
            ignoreFillProperties: ['pessoas']
        },

        /*
        Definindo atributo que se relaciona com
        Casa atraves da especificação de uma
        pesquisa
        */
        quantidadeCasas: {
            name: 'Casa',
            virtual: true,
            find: {},
            selectCount: true
        }
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})
```

Neste exemplo, toda vez que uma pessoa for buscada, o atributo _quantidadeCasas_ será preenchido com a quantidade de casas registrado dentro do sistema. Se a opção _find_ for um objeto vazio ou se não for definido, será buscado todos os elementos registrados na entidade relacionada.

A opção _find_ contém um objeto de pesquisa que será utilizada no primeiro argumento da função `restful.query`. Além desta opção, estão disponíveis as mesmas opções presentes no objeto do último argumento da função `restful.query`.

#### Relacionamento Virtual Dinâmico

Digamos que desejamos criar uma entidade chamada de _Familia_, que contém um atributo chamado de _sobrenome_.

```js
const Familia = new Entity({
    name: 'familia',
    resource: 'familias',
    descriptor: {
        sobrenome: String
    },
    methods: ['get', 'post', 'put', 'delete', 'patch']
})

restful.add(Familia)
```

Digamos ainda que ao fazer uma pesquisa por esta entidade, desejamos que seja retornado uma lista de todas as pessoas na qual seu nome termine com este sobrenome.

Para fazermos isto podemos utilizar o relacionamento virtual dinâmico, ou seja, haverá um relacionamento lógico, na qual uma entidade estará relacionada com outras entidades por intermédio de uma especificação de busca.

Atualmente, o relacionamento virtual dinâmico **não** está disponível na modelagem da entidade. Porém ele está disponível na chamada do método de preenchimento. Desta forma, podemos criar uma rota personalizada que chama o método de preenchimento e define nesta chamada o relacionamento virtual dinâmico:

```js
familias = await Familia.fill(familias, restful, {
    sync: familia => ({
        pessoas: {
            name: 'Pessoa',
            virtual: true,
            find: {
                'nome': new RegExp(`${familia.sobrenome}$`)
            }
        }
    })
})
```

O Código anterior exemplifica o uso do relacionamento virtual dinâmico. O método `Familia.fill` irá preencher o atributo _pessoas_ com a entidade relacionada _Pessoa_. Porém, apenas as pessoas na qual o nome termina com o sobrenome da família em questão, serão usados para preencher o atributo _pessoas_. Para realizar a verificação de se o nome da pessoa termina com o sobrenome da família, utilizou-se uma expressão regular.

Ao final deste código, cada família terá uma lista com todas as pessoas na qual o seu nome termina com o sobrenome da família em questão. Este código, ao ser colocado em uma rota personalizada, ou em uma projeção (explicada mais a frente) ou em um handler (explicado mais a frente), garantirá que as pessoas sejam separas por famílias, baseada em uma especificação lógica de busca, sem que haja a necessidade (a não ser por questões de performance) de armazenar estes dados no banco de dados.

### Projeção

Digamos que em determinadas situações, uma pesquisa qualquer deva ser retornada de uma maneira diferente, seja removendo atributos, seja adicionando outros atributos, seja modificando completamente o resultado da pesquisa. Isto pode ser feito através do uso de projeções.

As projeções podem ser definidas como array, objeto ou função.

#### Projeção Definida como Array

Digamos que em determinadas situações, independente da rota utilizada, uma pessoa somente deverá retornar os atributos _nome_ e _idade_. Neste caso podemos criar uma projeção, por exemplo com o nome de _projecao-base_.

```js
const Pessoa = new Entity({
    //...
    projections: {
        'projecao-base': ['nome', 'idade']
    }
})
```

Para chamar esta projeção em uma requisição http basta adicionar o atributo `projection=projecao-base` em alguma rota já existente de busca.

Por exemplo, se quisermos chamar esta projeção para a rota de busca de todas as pessoas, nós podemos fazer a seguinte requisição:

```http
/pessoas?projection=projecao-base
```

#### Projeção Definida como Objeto

Ainda continuando nossos exemplos de projeção, se quisermos que nossa projeção _projecao-base_ retorne APENAS pessoas contendo um (pode ter mais de um) atributo, sendo este atributo uma concatenação do nome com a idade da pessoa, basta fazer o seguinte:

```js
const Pessoa = new Entity({
    //...
    projections: {
        'projecao-base': {
            nomeComIdade: pessoa => `${pessoa.nome} ${pessoa.idade}`
        }
    }
})
```

#### Projeção Definida Como Função

E se quisermos que nossa projeção _projecao-base_ retorne, além do atributo _nomeComIdade_, os outros atributos também? Neste caso basta que nossa projeção seja uma função (sincrona ou assincrona) que adiciona o atributo _nomeComIdade_:

```js
const Pessoa = new Entity({
    //...
    projections: {
        'projecao-base': async function (pessoa, resolve, reject) {
            try {
              pessoa.nomeComIdade=`${pessoa.nome} ${pessoa.idade}`
              resolve(pessoa)
            } catch (err) {
              reject(err)
            }
        }
    }
})
```

Independente de nossa projeção ser assincrona ou sincrona, o método `resolve` deve ser chamado, sendo o argumento o objeto que será retornado pela rota. Em caso de erro, pode-se chamar o método `reject`, passando como argumento o objeto do erro.

#### Projeção Padrão

E se quisermos que nossa projeção _projecao-base_ seja executada automaticamente sem precisarmos passar `projection=projecao-base` em nossas requisições http? Para isto basta definir na entidade a opção _projectionDefault_:

```js
const Pessoa = new Entity({
    //...
    projections: {
        'projecao-base': async function (pessoa, resolve) {
            pessoa.nomeComIdade=`${pessoa.nome} ${pessoa.idade}`
            resolve(pessoa)
        }
    },
    projectionDefault: 'projecao-base'
})
```

#### Integrando as Projeções com Nossas Rotas Personalizadas

E se quisermos que nossas rotas personalizadas também usem nossas projeções? Neste caso basta adicionar dois novos argumentos no utilitário `restful.execAsync` e adicionar aquilo que seria enviado no atributo `res._content_`:

```js
app.get('/rota-personalizada',
    restful.execAsync(async function (req, res, next) {
        // ...
        // Código da rota personalizada
        // ...

        res._content_ = pessoas
        next()

    }, Pessoa.afterGetProjections(restful), 200)
)
```

##### Observação

Para que o código anterior funcione, é necessário que no código de sua rota personalizada não seja enviado nenhum dado como resposta. Aquilo que seria enviado pela rota como resposta deve ser adicionado na variavel `res._content_`, que o Alpha Restful se encarregará de enviar seu conteúdo.

No último argumento do `restful.execAsync` encontra-se o _status code_ de resposta do http. Caso você deseje, ao invés de colocar no ultimo argumento o _status code_, você pode passar outra função que se encarregará de enviar o conteúdo presente no `res._content_`.

#### Aplicando Projeções em um Objeto Qualquer

Se você deseja aplicar uma projeção de uma entidade em um objeto qualquer, basta você chamar o método `<Entidade>.applyProjections(<content>, <projectionName>, restful)`. Isto é muito útil para aplicar uma projeção em um atributo estando dentro da implementação de outra projeção.

Como exemplo disto, vamos criar uma projeção da entidade _Casa_, na qual tal projeção simplesmente aplica a projeção _projecao-base_ de _Pessoa_ no atributo _pessoas_:

```js
const Casa = new Entity({
    // ...
    projections: {
        'projecao-casa': async function (casa, resolve) {

            /*
            Dentro de uma projeção é altamente recomendável
            obter a entidade desejada por meio do atributo
            restful.entities
            */
            const Pessoa = restful.entities.Pessoa

            casa.pessoas = await Pessoa.applyProjections(
                casa.pessoas, 'projecao-base', restful
            )

            resolve(casa)
        }
    }
})
```

### Handlers

Por fim, vamos falar sobre os handlers! Um handler basicamente é uma função que será executada em algum momento específico. Por padrão os handlers são executados antes ou depois de cada rota CRUD http padrão gerada pelo Alpha Restful. Mas você pode integrar os handlers as suas rotas personalizadas.

Aqui está a lista de handlers disponíveis:

Handler        | Descrição
-------------- | -------------
beforeQuery (req, res, next) | Executado antes de aplicar uma rota _get_
afterQuery (entity, req, res, next) | Executado após a aplicação de uma rota _get_
beforeCreate (entity, req, res, next) | Executado antes da aplicação de uma rota _post_
afterCreate (entity, req, res, next) | Executado após a aplicação de uma rota _post_
beforeRemove (entity, req, res, next) | Executado antes da aplicação de uma rota _delete_
afterRemove (entity, req, res, next) | Executado após a aplicação de uma rota _delete_
beforeEdit (entity, req, res, next) | Executado antes da aplicação de uma rota _put_ ou _patch_
afterEdit (entity, req, res, next) | Executado após a aplicação de uma rota _put_ ou _patch_

Apenas o handler `beforeCreate` não recebe o conteúdo da entidade (ou entidades) como primeiro argumento. Nos demais handlers, o primeiro argumento é o conteúdo que está sendo manipulado. Este conteúdo também pode ser acessado pelo `res._content_`.

#### Atenção

Independente do handler ser uma função assincrona ou sincrona, o método `next()` deverá ser chamado ao final da execução do handler. Caso algum erro ocorra, pode-se chamar o método `next` passando como argumento o objeto do erro.

#### Implementando um handler

Para implementar um handler basta adicionar um método na entidade com o nome do handler desejado. Como exemplo vamos implementar o handler `afterQuery` que apenas irá printar a lista de pessoas antes de retornar na requisição.

```js
Pessoa.afterQuery = async function (pessoas, req, res, next) {
    console.log(pessoas)
    next()
}
```

Caso ocorra algum erro dentro do handler, basta passar o objeto do erro na função `next`.

#### Integrando os Handlers a suas Rotas Personalizadas

No utilitário `restful.execAsync`, você deverá chamar antes ou depois de sua(s) rota(s) personalizada(s) os handlers desejados, sempre lembrando que o Alpha Restful irá colocar como primeiro argumento de todos os handlers (com exceção do handler `beforeCreate`) o conteúdo da variável `res._content_`.

Para obter um handler, basta chamar a função `Entidade.getRouteHandler(<nome-do-handler>)`. O argumento da função `getRouteHandler` é o nome do handler.

Para exemplificar esta integração, definiremos uma rota personalizada que utilizará os handlers `beforeEdit` e `afterEdit`.

```js
app.put('/edit-pessoa',
    restful.execAsync(
        async function (req, res, next) {
            // ... faz alguma coisa
            // ... busca a pessoa
            // ... faz outra coisa

            res._content_ = pessoa
            next()
        },
        Pessoa.getRouteHandler('beforeEdit'),
        async function (req, res, next) {
            // ... faz alguma coisa
            // ... edita a pessoa
            // ... faz outra coisa
            next()
        },
        Pessoa.getRouteHandler('afterEdit'),
        200
    )
)
```

Neste exemplo nós chamados o handler `beforeEdit` e o handler `afterEdit`, mas poderíamos chamar somente um deles ou nenhum deles. O último argumento é o _status code_ http que será retornado caso tudo dê certo.

Por fim, se quisessemos integrar nossa rota personalizada ao `beforeEdit`, ao `afterEdit` e as nossas projeções explicadas anteriormente, poderíamos fazer o seguinte:

```js
app.put('/edit-pessoa',
    restful.execAsync(
        async function (req, res, next) {
            // ... faz alguma coisa
            // ... busca a pessoa
            // ... faz outra coisa

            res._content_ = pessoa
            next()
        },
        Pessoa.getRouteHandler('beforeEdit'),
        async function (req, res, next) {
            // ... faz alguma coisa
            // ... edita a pessoa
            // ... faz outra coisa
            next()
        },
        Pessoa.afterGetProjections(restful),
        Pessoa.getRouteHandler('afterEdit'),
        200
    )
)
```

Veja que aqui optamos por aplicar as projeções antes de nosso handler `afterEdit`, mas tranquilamente poderíamos alterar a ordem na qual essa chamadas são realizadas.

## Algumas Informações Importantes

O guia aqui presente engloga a grande maioria das funcionalidades implementadas, porém ainda existem alguns detalhes não especificados aqui. Em breve atualizarei este guia colocando nele mais informações.

Sinta-se a vontade de testar as funcionalidades aqui apresentadas e em caso de algum erro você poderá relatar aqui nas Issues que eu tentarei resolver o mais rápido possível.

Este software ainda **não** está 100% pronto. Existem alguns detalhes importantes a serem tratados e testes mais severos a serem realizados.

Sinta-se livre para sugerir qualquer mudança no framework ou para realizar qualquer sugestão de atualização de seu código fonte.
