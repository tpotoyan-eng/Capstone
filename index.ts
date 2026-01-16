enum httpMethodes {
  HTTP_POST_METHOD = "POST",
  HTTP_GET_METHOD = "GET",
}

enum httpStatus {
  HTTP_STATUS_OK = 200,
  HTTP_STATUS_INTERNAL_SERVER_ERROR = 500,
}

enum Role {
  User = "user",
  Admin = "Admin",
}

interface User {
  name: string;
  age: number;
  roles: [string, string?];
  createdAt: Date;
  isDeleated: boolean;
}

interface Request {
  method: httpMethodes;
  host: string;
  path: string;
  body?: User;
  params?: Record<string, string>;
}

type requestHandler = (req: Request) => void | never;
type errorHandler = (err: Error) => void | never;
type completeHandler = () => void;

interface Handlers<T> {
  next?: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}

class Observer<T> {
  private isUnsubscribed: boolean = false;
  public _unsubscribe?: () => void;

  constructor(private handlers: Handlers<T>) {}

  next(value: T): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }
      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }
      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable<T> {
  constructor(
    private _subscribe: (observer: Observer<T>) => (() => void) | void
  ) {}

  static from<T>(values: T[]): Observable<T> {
    return new Observable((observer: Observer<T>) => {
      values.forEach((value) => observer.next(value));
      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: Handlers<T>) {
    const observer = new Observer<T>(obs);

    const teardown = this._subscribe(observer);
    if (typeof teardown === "function") {
      observer._unsubscribe = teardown;
    }

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: User = {
  name: "User Name",
  age: 26,
  roles: [Role.User, Role.Admin],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: Request[] = [
  {
    method: httpMethodes.HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: httpMethodes.HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest: requestHandler = (request: Request) => {
  return { status: httpStatus.HTTP_STATUS_OK };
};
const handleError: errorHandler = (error: Error) => {
  return { status: httpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete: completeHandler = () => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
